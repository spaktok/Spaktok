const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

/**
 * وظيفة Cloud Function لحذف الرسائل الزائلة.
 * يتم تشغيل هذه الوظيفة عند إنشاء رسالة جديدة في Firestore.
 * إذا كانت الرسالة زائلة (Ephemeral)، يتم جدولة مهمة لحذفها بعد انقضاء عمرها الافتراضي.
 */
exports.scheduleEphemeralMessageDeletion = functions.firestore
    .document('chat_rooms/{chatRoomId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const messageData = snapshot.data();
        const { isEphemeral, deletedAt } = messageData;

        // التحقق مما إذا كانت الرسالة زائلة وتحتوي على وقت الحذف
        if (isEphemeral && deletedAt instanceof admin.firestore.Timestamp) {
            const messageRef = snapshot.ref;
            const currentTime = admin.firestore.Timestamp.now().toDate();
            const deletionTime = deletedAt.toDate();

            // حساب التأخير بالمللي ثانية
            const delayInMs = deletionTime.getTime() - currentTime.getTime();

            if (delayInMs > 0) {
                // جدولة مهمة الحذف باستخدام تأخير بسيط (لا يمكن جدولة مهام طويلة مباشرة)
                // في بيئة الإنتاج، يفضل استخدام Cloud Tasks لجدولة المهام الطويلة
                // هنا نستخدم setTimeout كنموذج مبسط (يعمل فقط لفترات قصيرة جدًا)

                // *للتطبيق العملي على نطاق واسع، يجب استخدام Cloud Tasks*

                // بما أننا لا نستطيع استخدام Cloud Tasks هنا، سنقوم بإنشاء حقل "حذف الآن"
                // وتشغيل وظيفة أخرى للتحقق من الحقل (نموذج Polling)

                // الحل البديل: وظيفة HTTP يتم تشغيلها بواسطة Cron Job (خارج نطاق Firebase)
                // أو دمج منطق الحذف في واجهة المستخدم عند قراءة الرسالة.

                // سنقوم هنا بإنشاء وظيفة بسيطة للتحقق من الرسائل المنتهية الصلاحية
                // والتي يجب أن يتم تشغيلها بانتظام (Cron Job)

                return messageRef.update({
                    'status': 'pending_deletion',
                });

            } else {
                // إذا كان وقت الحذف قد فات بالفعل، قم بحذفها فوراً
                return messageRef.delete();
            }
        }
        return null;
    });

/**
 * وظيفة HTTP يتم تشغيلها بواسطة Cron Job (أو يدوياً) لحذف الرسائل المنتهية الصلاحية.
 * هذه هي الطريقة الأكثر عملية بدون Cloud Tasks.
 */
exports.cleanupEphemeralMessages = functions.https.onRequest(async (req, res) => {
    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();
    const collections = ['chat_rooms']; // يجب تحديد جميع مجموعات الدردشة

    try {
        for (const collectionName of collections) {
            // البحث في جميع غرف الدردشة عن رسائل انتهت صلاحيتها
            const chatRoomsSnapshot = await db.collection(collectionName).get();

            for (const chatRoomDoc of chatRoomsSnapshot.docs) {
                const messagesSnapshot = await chatRoomDoc.ref.collection('messages')
                    .where('isEphemeral', '==', true)
                    .where('deletedAt', '<', now)
                    .get();

                messagesSnapshot.docs.forEach((doc) => {
                    functions.logger.log(`Deleting ephemeral message: ${doc.id} from chat room: ${chatRoomDoc.id}`);
                    batch.delete(doc.ref);
                });
            }
        }

        await batch.commit();
        res.status(200).send('Ephemeral messages cleanup completed.');

    } catch (error) {
        functions.logger.error('Error during ephemeral message cleanup:', error);
        res.status(500).send('Error during ephemeral message cleanup.');
    }
});

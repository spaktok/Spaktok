FROM node:18
WORKDIR /firebase
RUN npm install -g firebase-tools
COPY firebase.json ./
COPY .firebaserc ./
COPY firestore.rules ./
COPY storage.rules ./
COPY firestore.indexes.json ./
COPY functions ./functions
CMD ["firebase", "emulators:start", "--project=spaktok", "--only", "auth,firestore,functions,hosting,storage"]

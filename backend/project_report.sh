#!/bin/bash

REPORT_DIR="report_output"
REPORT_FILE="$REPORT_DIR/project_report.txt"
ZIP_FILE="project_report.zip"

# إنشاء مجلد للتقرير
mkdir -p $REPORT_DIR
echo "📊 تقرير المشروع - $(date)" > $REPORT_FILE
echo "===============================" >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "📂 ملفات ومجلدات المشروع" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
tree -L 3 >> $REPORT_FILE 2>/dev/null

echo "" >> $REPORT_FILE
echo "🐳 الحاويات (Containers)" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "📦 الصور (Images)" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "🌐 الشبكات (Networks)" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
docker network ls >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "💾 الـ Volumes" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
docker volume ls >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "📚 المكتبات في backend" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
if [ -f ./backend/package.json ]; then
  jq '.dependencies' ./backend/package.json >> $REPORT_FILE
else
  echo "لا يوجد package.json في backend" >> $REPORT_FILE
fi

echo "" >> $REPORT_FILE
echo "📚 المكتبات في frontend" >> $REPORT_FILE
echo "-------------------------------" >> $REPORT_FILE
if [ -f ./frontend/package.json ]; then
  jq '.dependencies' ./frontend/package.json >> $REPORT_FILE
else
  echo "لا يوجد package.json في frontend" >> $REPORT_FILE
fi

# ضغط التقرير كملف zip
zip -r $ZIP_FILE $REPORT_DIR > /dev/null

echo ""
echo "✅ تم إنشاء التقرير وحفظه في: $REPORT_FILE"
echo "✅ تم ضغط التقرير في: $ZIP_FILE"

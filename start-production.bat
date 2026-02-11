@echo off
echo ====================================
echo 启动生产环境服务器
echo ====================================

cd backend
set NODE_ENV=production
npm start

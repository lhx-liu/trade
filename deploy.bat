@echo off
echo ====================================
echo 开始构建和部署应用
echo ====================================

echo.
echo [1/4] 构建前端...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo 前端构建失败！
    exit /b %errorlevel%
)

echo.
echo [2/4] 构建后端...
cd ..\backend
call npm run build
if %errorlevel% neq 0 (
    echo 后端构建失败！
    exit /b %errorlevel%
)

echo.
echo [3/4] 复制环境配置...
copy .env.production dist\.env

echo.
echo [4/4] 构建完成！
echo.
echo ====================================
echo 部署说明：
echo ====================================
echo 1. 前端文件位置: frontend/dist
echo 2. 后端文件位置: backend/dist
echo 3. 启动命令: cd backend ^&^& npm start
echo 4. 访问地址: http://localhost:5000
echo ====================================

cd ..

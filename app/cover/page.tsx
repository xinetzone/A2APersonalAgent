'use client';

import { useEffect, useRef, useState } from 'react';

export default function CoverGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [pngUrl, setPngUrl] = useState('');
  const [jpgUrl, setJpgUrl] = useState('');

  const generateCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, width, height);

    const gradient1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, 600);
    gradient1.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
    gradient1.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, width, height);

    const gradient2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, 500);
    gradient2.addColorStop(0, 'rgba(139, 90, 43, 0.25)');
    gradient2.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = 100 + i * 50;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + 30);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 50, 180, 0, Math.PI * 2);
    const circleGradient = ctx.createRadialGradient(width / 2, height / 2 - 50, 100, width / 2, height / 2 - 50, 180);
    circleGradient.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
    circleGradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.08)');
    circleGradient.addColorStop(1, 'rgba(212, 175, 55, 0.02)');
    ctx.fillStyle = circleGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 50, 140, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2 - 80, height / 2 - 50);
    ctx.lineTo(width / 2 + 80, height / 2 - 50);
    ctx.moveTo(width / 2, height / 2 - 130);
    ctx.lineTo(width / 2, height / 2 + 30);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 50, 60, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const drawLotus = (cx: number, cy: number, scale: number) => {
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
        const nextAngle = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const petalLength = 80 * scale;
        const cp1x = cx + Math.cos(angle - 0.3) * petalLength * 0.6;
        const cp1y = cy + Math.sin(angle - 0.3) * petalLength * 0.6 - 20 * scale;
        const cp2x = cx + Math.cos(angle + 0.3) * petalLength * 0.6;
        const cp2y = cy + Math.sin(angle + 0.3) * petalLength * 0.6 - 20 * scale;
        const tipX = cx + Math.cos((angle + nextAngle) / 2) * petalLength;
        const tipY = cy + Math.sin((angle + nextAngle) / 2) * petalLength - 30 * scale;

        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
        ctx.quadraticCurveTo(cp2x, cp2y, cx, cy);

        const petalGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, petalLength);
        petalGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        petalGradient.addColorStop(0.5, 'rgba(255, 245, 235, 0.7)');
        petalGradient.addColorStop(1, 'rgba(212, 175, 55, 0.3)');
        ctx.fillStyle = petalGradient;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 25 * scale, 0, Math.PI * 2);
      const centerGradient = ctx.createRadialGradient(cx - 5 * scale, cy - 5 * scale, 0, cx, cy, 25 * scale);
      centerGradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
      centerGradient.addColorStop(1, 'rgba(212, 175, 55, 1)');
      ctx.fillStyle = centerGradient;
      ctx.fill();
    };

    drawLotus(width / 2, height / 2 - 50, 1);

    ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 120px "Noto Serif SC", "STSong", "SimSun", serif';
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('道德人生', width / 2, height - 180);
    ctx.shadowBlur = 0;

    ctx.font = '36px "Noto Serif SC", "STSong", "SimSun", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('探寻道家智慧 · 指引道德生活', width / 2, height - 100);

    ctx.font = '24px "Noto Serif SC", "STSong", "SimSun", serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.fillText('MORAL LIFE', width / 2, height - 55);

    const corners = [
      { x: 60, y: 60, sx: 1, sy: 1 },
      { x: width - 60, y: 60, sx: -1, sy: 1 },
      { x: 60, y: height - 60, sx: 1, sy: -1 },
      { x: width - 60, y: height - 60, sx: -1, sy: -1 },
    ];

    corners.forEach(({ x, y, sx, sy }) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 40 * sy);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 40 * sx, y);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 10 * sx, y + 25 * sy);
      ctx.lineTo(x + 10 * sx, y + 10 * sy);
      ctx.lineTo(x + 25 * sx, y + 10 * sy);
      ctx.stroke();
    });

    ctx.font = '20px "Noto Serif SC", "STSong", "SimSun", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'left';
    ctx.fillText('v1.0.0', 80, height - 30);
    ctx.textAlign = 'right';
    ctx.fillText('道德经智慧应用', width - 80, height - 30);

    setIsGenerated(true);

    setPngUrl(canvas.toDataURL('image/png'));
    setJpgUrl(canvas.toDataURL('image/jpeg', 0.95));
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  useEffect(() => {
    generateCover();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-400 mb-4">道德人生封面生成器</h1>
          <p className="text-slate-300 text-lg">专业应用商店封面图片 · 16:9比例 · 1920×1080分辨率</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xl font-semibold text-white mb-4">预览效果</h2>
            <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={generateCover}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                重新生成
              </button>
              {isGenerated && (
                <>
                  <button
                    onClick={() => downloadImage(pngUrl, '道德人生-cover-1920x1080.png')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    下载 PNG
                  </button>
                  <button
                    onClick={() => downloadImage(jpgUrl, '道德人生-cover-1920x1080.jpg')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    下载 JPG
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xl font-semibold text-white mb-4">规格说明</h2>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-2">尺寸规格</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• 分辨率: 1920 × 1080 像素</li>
                  <li>• 宽高比: 16:9</li>
                  <li>• 适用: 应用商店、网页展示</li>
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-2">设计元素</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• 道家八卦/阴阳元素</li>
                  <li>• 莲花图案象征纯净与成长</li>
                  <li>• 金色主色调代表智慧与尊贵</li>
                  <li>• 深蓝底色传递深邃与宁静</li>
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-2">输出格式</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• PNG: 无损压缩，适合透明背景需求</li>
                  <li>• JPG: 高质量压缩，文件更小</li>
                  <li>• 预估文件大小: PNG ~2-3MB, JPG ~1-2MB</li>
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-2">文件命名</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• 道德人生-cover-1920x1080.png</li>
                  <li>• 道德人生-cover-1920x1080.jpg</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">设计理念</h2>
          <div className="grid md:grid-cols-3 gap-6 text-slate-300">
            <div>
              <h3 className="text-amber-400 font-medium mb-2">色彩哲学</h3>
              <p className="text-sm">深邃的藏青色背景象征宇宙与道的深邃，金色点缀代表智慧之光，整体传达宁静而庄重的东方美学。</p>
            </div>
            <div>
              <h3 className="text-amber-400 font-medium mb-2">图形语言</h3>
              <p className="text-sm">中央太极图案与八卦线条体现道家核心思想，莲花象征道德的净化与心灵的成长，周围光芒暗示智慧的普照。</p>
            </div>
            <div>
              <h3 className="text-amber-400 font-medium mb-2">排版设计</h3>
              <p className="text-sm">采用庄重的宋体/衬线字体，大字号标题确保在各种尺寸下清晰可读，英文副标题增强国际范儿。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
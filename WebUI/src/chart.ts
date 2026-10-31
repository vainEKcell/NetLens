// 顶栏迷你曲线：自绘 canvas 面积图（上行绿 / 下行蓝），60 秒窗口
const UP = 60;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const downSeries: number[] = [];
const upSeries: number[] = [];

export function initSpark(): void {
  canvas = document.getElementById("spark-canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d");
}

export function pushPoint(up: number, down: number): void {
  upSeries.push(up);
  downSeries.push(down);
  if (upSeries.length > UP) { upSeries.shift(); downSeries.shift(); }
  draw();
}

function draw(): void {
  if (!ctx || !canvas) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(1024, ...downSeries, ...upSeries) * 1.15;
  drawArea(downSeries, max, "rgba(88, 166, 255, 0.9)", "rgba(88, 166, 255, 0.12)");
  drawArea(upSeries, max, "rgba(63, 191, 127, 0.9)", "rgba(63, 191, 127, 0.10)");
}

function drawArea(series: number[], max: number, stroke: string, fill: string): void {
  if (!ctx || !canvas || series.length < 2) return;
  const w = canvas.width, h = canvas.height, n = UP;
  ctx.beginPath();
  for (let i = 0; i < series.length; i++) {
    const x = w - ((series.length - 1 - i) / (n - 1)) * w;
    const y = h - (series[i] / max) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineTo(w, h);
  ctx.lineTo(w - ((series.length - 1) / (n - 1)) * w, h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

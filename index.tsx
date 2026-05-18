import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const FUN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  
  body {
    font-family: 'Nunito', sans-serif;
    margin: 0;
    padding: 0;
  }
  
  .pattern-bg {
    background-color: #f0f9ff;
    background-image: radial-gradient(#bae6fd 2px, transparent 2px), radial-gradient(#bae6fd 2px, transparent 2px);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
  }

  .fun-btn {
    border-bottom: 6px solid rgba(0,0,0,0.2) !important;
    transition: transform 0.1s, border-bottom 0.1s !important;
  }
  .fun-btn:active {
    transform: translateY(4px) !important;
    border-bottom: 2px solid rgba(0,0,0,0.2) !important;
  }

  .fun-card {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 4px solid transparent;
  }
  .fun-card:hover {
    transform: translateY(-8px) scale(1.02);
  }
    
  .cloud-title {
    background: white;
    border-radius: 50px;
    box-shadow: 0 10px 0 #e0f2fe;
    padding: 15px 40px;
    display: inline-block;
    border: 4px solid #bae6fd;
    transform: rotate(-1.5deg);
    color: #ff6b6b;
  }

  .floating {
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  .chapters-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
  }
  @media (min-width: 600px) {
    .chapters-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .chapters-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
`;

// --- TYPES ---
type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation?: string; // Giữ lại để không lỗi code sinh đề, nhưng không hiển thị
};

type TheoryItem = {
  type: 'header' | 'text' | 'box' | 'example' | 'image';
  content: string;
  title?: string;
};

type ChapterData = {
  id: string;
  title: string;
  icon: string;
  desc: string;
  theory: TheoryItem[];
};

// --- UTILS (CÔNG CỤ HỖ TRỢ SINH ĐỀ) ---

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomFloat = (min: number, max: number, decimals: number = 1) => {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
};

// Định dạng số theo chuẩn Việt Nam (dấu phẩy cho số thập phân)
const formatNum = (num: number): string => {
  const rounded = Math.round(num * 1000) / 1000;
  return rounded.toString().replace('.', ',');
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Tạo đáp án nhiễu (Distractors)
const generateOptions = (correctVal: number, type: 'int' | 'float' = 'int', unit: string = ''): string[] => {
  const options = new Set<string>();
  options.add(formatNum(correctVal) + (unit ? ` ${unit}` : ''));

  let attempts = 0;
  while (options.size < 4 && attempts < 20) {
    let wrongVal;
    if (type === 'int') {
      const offset = getRandomInt(1, 10) * (Math.random() > 0.5 ? 1 : -1);
      wrongVal = correctVal + offset;
    } else {
      const offset = getRandomFloat(0.1, 5, 1) * (Math.random() > 0.5 ? 1 : -1);
      wrongVal = parseFloat((correctVal + offset).toFixed(type === 'float' ? 1 : 2));
    }
    
    // Đôi khi tạo đáp án sai kiểu nhân/chia 10 (lỗi hay gặp)
    if (Math.random() < 0.3) wrongVal = correctVal * 10;
    else if (Math.random() < 0.3) wrongVal = correctVal / 10;

    // Đảm bảo đáp án là số nguyên nếu type là 'int' (đặc biệt quan trọng với bài toán đếm người/vật)
    if (type === 'int') {
      wrongVal = Math.round(wrongVal);
    }

    if (wrongVal > 0) { // Chỉ lấy số dương cho đơn giản hoá ngữ cảnh tiểu học
       options.add(formatNum(wrongVal) + (unit ? ` ${unit}` : ''));
    }
    attempts++;
  }
  
  // Nếu không đủ đáp án (do trùng), thêm đại
  while (options.size < 4) {
     const r = type === 'int' ? getRandomInt(1, 100) : getRandomFloat(1, 100);
     options.add(formatNum(r) + (unit ? ` ${unit}` : ''));
  }

  return shuffleArray(Array.from(options));
};

const createQuestion = (question: string, correctVal: number, type: 'int' | 'float' = 'int', unit: string = '', explanation: string = ''): Question => {
  const options = generateOptions(correctVal, type, unit);
  const correctStr = formatNum(correctVal) + (unit ? ` ${unit}` : '');
  return {
    id: Math.random(),
    question,
    options,
    correct: options.indexOf(correctStr),
    explanation
  };
};

// --- DỮ LIỆU ĐỊA PHƯƠNG (PHÚ THỌ) ---
const PHUTHO_LOCATIONS = [
  "Đền Hùng (Việt Trì)", "Đền Mẫu Âu Cơ (Hạ Hòa)", "Vườn Quốc gia Xuân Sơn (Tân Sơn)", 
  "Ao Châu (Hạ Hòa)", "Đầm Ao Châu", "Đồi chè Long Cốc (Tân Sơn)", 
  "Làng cổ Hùng Lô (Việt Trì)", "Khu di tích lịch sử Đền Hùng"
];

const PHUTHO_SPECIALTIES = [
  { name: "Bưởi Đoan Hùng", unit: "quả", isWeight: false },
  { name: "Thịt chua Thanh Sơn", unit: "hộp", isWeight: false },
  { name: "Chè Long Cốc", unit: "kg", isWeight: true },
  { name: "Gạo nếp gà gáy Mỹ Lung", unit: "kg", isWeight: true },
  { name: "Cá thính Tử Đà", unit: "hộp", isWeight: false },
  { name: "Bánh chưng Đất Tổ", unit: "cái", isWeight: false },
  { name: "Cọ ẻo Phú Thọ", unit: "kg", isWeight: true },
  { name: "Hồng Hạc Trì", unit: "kg", isWeight: true }
];

const PHUTHO_ROUTES = [
  { from: "thành phố Việt Trì", to: "huyện Đoan Hùng", scenarios: [{v: 35, t: 2, s: 70}, {v: 40, t: 1.5, s: 60}, {v: 42, t: 1.5, s: 63}, {v: 36, t: 2, s: 72}] },
  { from: "huyện Lâm Thao", to: "thành phố Việt Trì", scenarios: [{v: 30, t: 0.5, s: 15}, {v: 40, t: 0.5, s: 20}, {v: 36, t: 0.5, s: 18}] },
  { from: "thị xã Phú Thọ", to: "huyện Thanh Sơn", scenarios: [{v: 30, t: 1.5, s: 45}, {v: 40, t: 1.25, s: 50}, {v: 36, t: 1.25, s: 45}] },
  { from: "huyện Tân Sơn", to: "huyện Thanh Thủy", scenarios: [{v: 36, t: 1.5, s: 54}, {v: 40, t: 1.25, s: 50}, {v: 32, t: 2, s: 64}] },
  { from: "thị trấn Yên Lập", to: "thành phố Việt Trì", scenarios: [{v: 40, t: 2, s: 80}, {v: 35, t: 2, s: 70}, {v: 38, t: 2, s: 76}] }
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- BỘ MÁY SINH CÂU HỎI (GENERATORS) ---

const Generators = {
  chuong1: () => { // Số thập phân
    const qs: Question[] = [];
    for (let i = 0; i < 10; i++) {
        const type = (i % 4) + 1;
        if (type === 1) { // Đọc số, viết số
          const isWrite = Math.random() > 0.5;
          const numList = [
            { text: "Sáu mươi tám phẩy bốn mươi hai", val: 68.42, read: "Sáu mươi tám phẩy bốn mươi hai" },
            { text: "Hai mươi lăm phẩy mười lăm", val: 25.15, read: "Hai mươi lăm phẩy mười lăm" },
            { text: "Không phẩy bảy mươi lăm", val: 0.75, read: "Không phẩy bảy mươi lăm" },
            { text: "Mười hai phẩy không ba", val: 12.03, read: "Mười hai phẩy không ba" },
            { text: "Năm phẩy ba trăm mười bốn", val: 5.314, read: "Năm phẩy ba trăm mười bốn" }
          ];
          const item = getRandomItem(numList);
          if (isWrite) {
            qs.push(createQuestion(`Số "${item.text}" được viết là:`, item.val, 'float', '', `Số "${item.text}" viết là ${formatNum(item.val)}.`));
          } else {
            const wrong1 = item.read.replace("phẩy ", "phẩy không ");
            const wrong2 = item.read.includes("mươi ") ? item.read.replace("mươi ", "mươi không ") : item.read.replace("phẩy ", "phẩy không không ");
            let optsArr = Array.from(new Set([item.read, wrong1, wrong2, "Không có đáp án đúng"]));
            if (optsArr.length < 4) optsArr.push("Đáp án khác");
            qs.push({
              id: Math.random(),
              question: `Số ${formatNum(item.val)} được đọc là:`,
              options: shuffleArray(optsArr),
              correct: -1,
              explanation: `Số ${formatNum(item.val)} được đọc là: ${item.read}.`
            });
            qs[qs.length - 1].correct = qs[qs.length - 1].options.indexOf(item.read);
          }
        } else if (type === 2) { // Giá trị theo hàng
          const uniqueDigits = shuffleArray([2, 3, 4, 6, 7, 8, 9]);
          const a = uniqueDigits[0];
          const b = uniqueDigits[1];
          const c = uniqueDigits[2];
          const numStr = `1${a},${b}${c}5`;
          qs.push({
            id: Math.random(),
            question: `Trong số thập phân ${numStr}, chữ số ${c} thuộc hàng nào?`,
            options: shuffleArray(["Hàng phần mười", "Hàng phần trăm", "Hàng phần nghìn", "Hàng đơn vị"]),
            correct: -1,
            explanation: `Trong số thập phân ${numStr}:\n- Chữ số 1 thuộc hàng chục.\n- Chữ số ${a} thuộc hàng đơn vị.\n- Chữ số ${b} thuộc hàng phần mười.\n- Chữ số ${c} thuộc hàng phần trăm.\n- Chữ số 5 thuộc hàng phần nghìn.`
          });
          const opts = qs[qs.length - 1].options;
          const correctTxt = "Hàng phần trăm";
          qs[qs.length - 1].correct = opts.indexOf(correctTxt);
        } else if (type === 3) { // So sánh
          const base = getRandomFloat(10, 50, 1);
          const diff = 0.1;
          const target = parseFloat((base + diff).toFixed(1));
          qs.push({
            id: Math.random(),
            question: `Số nào dưới đây lớn hơn ${formatNum(base)}?`,
            options: shuffleArray([formatNum(target), formatNum(base - 0.1), formatNum(base - 1), formatNum(base)]),
            correct: -1,
            explanation: `Ta so sánh các số:\n${formatNum(target)} > ${formatNum(base)} (Vì phần nguyên bằng nhau, hàng phần mười ${formatNum(target).split(',')[1] || 0} > ${formatNum(base).split(',')[1] || 0}).`
          });
          qs[qs.length - 1].correct = qs[qs.length - 1].options.indexOf(formatNum(target));

        } else { // Làm tròn
          const num = getRandomFloat(10, 99, 2); 
          const rounded = Math.round(num);
          qs.push(createQuestion(`Diện tích một đồi chè ở Tân Sơn là ${formatNum(num)} ha. Làm tròn diện tích đó đến hàng đơn vị ta được:`, rounded, 'int', 'ha', `Hàng phần mười của ${formatNum(num)} là ${Math.floor((num * 10) % 10)}.\nNếu hàng phần mười >= 5 thì làm tròn lên, < 5 thì làm tròn xuống.\nVậy ${formatNum(num)} làm tròn thành ${rounded}.`));
        }
    }
    return shuffleArray(qs);
  },
  chuong2: () => { // Đơn vị đo diện tích, thể tích, khối lượng, độ dài
    const qs: Question[] = [];
    for (let i = 0; i < 10; i++) {
      const type = (i % 3) + 1;
      if (type === 1) { // Đổi đơn vị
        const subtype = getRandomInt(1, 3);
        if (subtype === 1) {
          const ha = getRandomInt(2, 5);
          const randPlace = getRandomItem(["khu bảo tồn Đền Hùng", "đồi chè Long Cốc", "vườn Quốc gia Xuân Sơn"]);
          qs.push(createQuestion(`Một mảnh đất ở ${randPlace} có diện tích ${ha} ha. Diện tích đó bằng bao nhiêu mét vuông?`, ha * 10000, 'int', 'm²', `1 ha = 10 000 m². Vậy ${ha} ha = ${ha * 10000} m².`));
        } else if (subtype === 2) {
          const m = getRandomInt(3, 8);
          const cm = getRandomInt(10, 99);
          const val = parseFloat(`${m}.${cm}`); 
          const correctVal = m + cm/100;
          const tree = getRandomItem(["Cây Cọ", "Cây Keo", "Cây Mỡ", "Cây Bưởi"]);
          qs.push(createQuestion(`Một ${tree} ở vùng đồi Phú Thọ cao ${m}m ${cm}cm. Chiều cao của cây viết dưới dạng số thập phân là bao nhiêu m?`, correctVal, 'float', 'm', `Ta có: ${cm}cm = ${cm}/100 m = ${formatNum(cm/100)}m.\nVậy ${m}m ${cm}cm = ${m}m + ${formatNum(cm/100)}m = ${formatNum(correctVal)}m.`));
        } else {
          const kg = getRandomInt(1, 5);
          const g = getRandomInt(10, 990);
          const val = kg + g / 1000;
          qs.push(createQuestion(`${kg}kg ${g}g = ... kg. Số thích hợp để điền vào chỗ chấm là:`, val, 'float', '', `Ta có: ${g}g = ${g}/1000 kg = ${formatNum(g/1000)}kg.\nVậy ${kg}kg ${g}g = ${formatNum(val)}kg.`));
        }
      } else if (type === 2) { // Điền dấu (so sánh 2 đại lượng)
        const isBigger = Math.random() > 0.5;
        const isEqual = Math.random() > 0.7; // 30% chance for equality
        const m = getRandomInt(2, 9);
        const cm = getRandomInt(1, 99);
        const val1Str = `${m}m ${cm}cm`;
        const val1InM = m + cm / 100;
        let val2InM = val1InM;
        let val2Str = `${formatNum(val2InM)}m`;
        let correctSign = "=";
        if (!isEqual) {
           if (isBigger) {
             val2InM = val1InM - 0.1;
             correctSign = ">";
           } else {
             val2InM = val1InM + 0.1;
             correctSign = "<";
           }
           val2InM = parseFloat(val2InM.toFixed(2));
           val2Str = `${formatNum(val2InM)}m`;
        }
        qs.push({
          id: Math.random(),
          question: `Điền dấu thích hợp vào chỗ chấm: ${val1Str} ... ${val2Str}`,
          options: shuffleArray([">", "<", "=", "Không thể so sánh"]),
          correct: -1,
          explanation: `Đổi ${val1Str} = ${formatNum(val1InM)}m.\nSo sánh: ${formatNum(val1InM)} ${correctSign} ${formatNum(val2InM)} nên dấu cần điền là ${correctSign}.`
        });
        qs[qs.length - 1].correct = qs[qs.length - 1].options.indexOf(correctSign);
      } else { // So sánh với phép tính
        const v1 = getRandomFloat(1, 5, 1);
        const v2 = getRandomFloat(1, 5, 1);
        const sum = v1 + v2;
        let comp = sum;
        let correctSign = "=";
        const rand = Math.random();
        if (rand < 0.33) {
          comp = sum + 0.5;
          correctSign = "<";
        } else if (rand < 0.66) {
          comp = sum - 0.5;
          correctSign = ">";
        }
        qs.push({
          id: Math.random(),
          question: `Dấu thích hợp để điền vào chỗ chấm là: ${formatNum(v1)} tấn + ${formatNum(v2)} tấn ... ${formatNum(comp)} tấn`,
          options: shuffleArray([">", "<", "=", "Không thể so sánh"]),
          correct: -1,
          explanation: `Thực hiện phép tính: ${formatNum(v1)} + ${formatNum(v2)} = ${formatNum(sum)} tấn.\nSo sánh ${formatNum(sum)} ${correctSign} ${formatNum(comp)} nên dấu cần điền là ${correctSign}.`
        });
        qs[qs.length - 1].correct = qs[qs.length - 1].options.indexOf(correctSign);
      }
    }
    return shuffleArray(qs);
  },
  chuong3: () => { // Phép tính số thập phân
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const type = (i % 7) + 1;
        if (type === 1) { // Cộng
          const a = getRandomFloat(10, 50, 2);
          const b = getRandomFloat(10, 50, 2);
          const ans = parseFloat((a + b).toFixed(2));
          qs.push(createQuestion(`Thực hiện phép tính: ${formatNum(a)} + ${formatNum(b)} = ?`, ans, 'float', '', `${formatNum(a)} + ${formatNum(b)} = ${formatNum(ans)}.`));
        } else if (type === 2) { // Trừ
          const a = getRandomFloat(30, 99, 2);
          const b = getRandomFloat(10, 29, 2);
          const ans = parseFloat((a - b).toFixed(2));
          qs.push(createQuestion(`Thực hiện phép tính: ${formatNum(a)} - ${formatNum(b)} = ?`, ans, 'float', '', `${formatNum(a)} - ${formatNum(b)} = ${formatNum(ans)}.`));
        } else if (type === 3) { // Nhân
          const a = getRandomFloat(1, 10, 2);
          const b = getRandomFloat(2, 5, 1);
          const ans = parseFloat((a * b).toFixed(3));
          qs.push(createQuestion(`Thực hiện phép tính: ${formatNum(a)} x ${formatNum(b)} = ?`, ans, 'float', '', `${formatNum(a)} x ${formatNum(b)} = ${formatNum(ans)}.`));
        } else if (type === 4) { // Chia STN cho STP
          const opts = [[12, 1.5, 8], [24, 2.5, 9.6], [10, 0.5, 20], [15, 2.5, 6], [18, 1.2, 15]];
          const [divd, divs, ans] = getRandomItem(opts);
          qs.push(createQuestion(`Thực hiện phép tính: ${formatNum(divd)} : ${formatNum(divs)} = ?`, ans, 'float', '', `${formatNum(divd)} : ${formatNum(divs)} = ${formatNum(ans)}.`));
        } else if (type === 5) { // Chia STP cho STP
          const ans = getRandomFloat(1.1, 5.5, 1);
          const divs = getRandomFloat(1.1, 3.5, 1);
          const divd = parseFloat((ans * divs).toFixed(2));
          qs.push(createQuestion(`Thực hiện phép tính: ${formatNum(divd)} : ${formatNum(divs)} = ?`, ans, 'float', '', `${formatNum(divd)} : ${formatNum(divs)} = ${formatNum(ans)}.`));
        } else if (type === 6) { // Chia STP cho STN
          const ans = getRandomFloat(1.1, 5.5, 2);
          const divs = getRandomInt(2, 9);
          const divd = parseFloat((ans * divs).toFixed(2));
          qs.push(createQuestion(`Thực hiện phép tính: ${formatNum(divd)} : ${formatNum(divs)} = ?`, ans, 'float', '', `${formatNum(divd)} : ${formatNum(divs)} = ${formatNum(ans)}.`));
        } else { // Tìm số dư
          const qs_du = [
            { divd: 43.19, divs: 21, quo: 2.05, rem: 0.14 },
            { divd: 22.44, divs: 18, quo: 1.24, rem: 0.12 },
            { divd: 15.26, divs: 12, quo: 1.27, rem: 0.02 },
            { divd: 5.75, divs: 4, quo: 1.43, rem: 0.03 },
            { divd: 6.25, divs: 7, quo: 0.89, rem: 0.02 }
          ];
          const item = getRandomItem(qs_du);
          qs.push(createQuestion(`Trong phép chia ${formatNum(item.divd)} : ${formatNum(item.divs)} nếu thương lấy hai chữ số ở phần thập phân là ${formatNum(item.quo)} thì số dư là:`, item.rem, 'float', '', `Thử lại: ${formatNum(item.divs)} x ${formatNum(item.quo)} = ${formatNum(parseFloat((item.divs * item.quo).toFixed(2)))}.\nVậy số dư là: ${formatNum(item.divd)} - ${formatNum(parseFloat((item.divs * item.quo).toFixed(2)))} = ${formatNum(item.rem)}.`));
        }
    }
    return shuffleArray(qs);
  },
  chuong4: () => { // Hình học phẳng
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const type = (i % 5) + 1;
        if (type === 1) { // Tính diện tích (tam giác)
            const a = getRandomFloat(10, 50, 1);
            const h = getRandomFloat(5, 20, 1);
            const s = (a * h) / 2;
            const context = getRandomItem(["Một mảnh đất trồng chè ở Tân Sơn", "Một mảnh vườn ở công viên Văn Lang"]);
            qs.push(createQuestion(`${context} hình tam giác có độ dài đáy ${formatNum(a)}m và chiều cao ${formatNum(h)}m. Diện tích là:`, parseFloat(s.toFixed(2)), 'float', 'm²', `Diện tích = (đáy x chiều cao) : 2.\nS = (${formatNum(a)} x ${formatNum(h)}) : 2 = ${formatNum(parseFloat(s.toFixed(2)))} (m²).`));
        } else if (type === 2) { // Tính chu vi hình tròn
            const r = getRandomInt(10, 50); 
            const c = r * 2 * 3.14;
            qs.push(createQuestion(`Mặt một chiếc bàn hình tròn có bán kính r = ${r}cm. Chu vi mặt bàn là:`, parseFloat(c.toFixed(2)), 'float', 'cm', `Chu vi = r x 2 x 3,14.\nC = ${r} x 2 x 3,14 = ${formatNum(parseFloat(c.toFixed(2)))} (cm).`));
        } else if (type === 3) { // Tìm chiều cao tam giác
            const h = getRandomInt(5, 20);
            const a = getRandomInt(10, 40);
            const s = (a * h) / 2;
            qs.push(createQuestion(`Một biển báo giao thông hình tam giác có diện tích ${formatNum(s)} cm² và độ dài đáy là ${a} cm. Chiều cao của biển báo là:`, h, 'int', 'cm', `Chiều cao = Diện tích x 2 : đáy.\nh = ${formatNum(s)} x 2 : ${a} = ${h} (cm).`));
        } else if (type === 4) { // Tìm bán kính hình tròn
            const r = getRandomInt(2, 15);
            const c = parseFloat((r * 2 * 3.14).toFixed(2));
            qs.push(createQuestion(`Một hồ nước hình tròn có chu vi là ${formatNum(c)} m. Bán kính của hồ nước đó là:`, r, 'int', 'm', `Bán kính = Chu vi : 3,14 : 2.\nr = ${formatNum(c)} : 3,14 : 2 = ${r} (m).`));
        } else { // Tìm đáy hình thang
            const a = getRandomInt(15, 30);
            const b = getRandomInt(5, 14);
            const h = getRandomInt(5, 20);
            const s = ((a + b) * h) / 2;
            qs.push(createQuestion(`Một thửa ruộng hình thang có diện tích ${formatNum(s)} m², chiều cao là ${h} m. Biết đáy bé là ${b} m, độ dài đáy lớn là:`, a, 'int', 'm', `Tổng độ dài hai đáy = Diện tích x 2 : chiều cao = ${formatNum(s)} x 2 : ${h} = ${a+b} (m).\nĐáy lớn = Tổng 2 đáy - đáy bé = ${a+b} - ${b} = ${a} (m).`));
        }
    }
    return shuffleArray(qs);
  },
  chuong5: () => { // Tỉ số phần trăm, biểu đồ
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const type = (i % 4) + 1;
        if (type === 1) { // Tìm tỉ số % của hai số
            const a = getRandomInt(1, 10) * 5; 
            const b = 100; // Let's make b dynamic but simple: 50, 100, 200
            const bList = [50, 100, 200, 400];
            const chosenB = getRandomItem(bList);
            const chosenA = getRandomInt(1, chosenB/5) * 5;
            const val = (chosenA / chosenB) * 100;
            qs.push(createQuestion(`Lớp 5A có ${chosenB} học sinh, trong đó có ${chosenA} học sinh nữ. Tỉ số phần trăm của số học sinh nữ và tổng số học sinh là:`, val, 'int', '%', `Tỉ số phần trăm: ${chosenA} : ${chosenB} = ${formatNum(chosenA/chosenB)} = ${val}%.`));
        } else if (type === 2) { // Tìm giá trị % của 1 số
            const percent = getRandomInt(1, 9) * 10;
            const total = getRandomInt(10, 50) * 10;
            const val = (total * percent) / 100;
            qs.push(createQuestion(`Một mảnh vườn có ${total} cây ăn quả. Số cây nhãn chiếm ${percent}%. Hỏi có bao nhiêu cây nhãn trong vườn?`, val, 'int', 'cây', `Số cây nhãn là: ${total} x ${percent} : 100 = ${val} (cây).`));
        } else if (type === 3) { // Bài toán mua bán, tiền lãi, tiền vốn
            const isInterestOnly = Math.random() < 0.5;
            const goc = getRandomInt(2, 5) * 1000000;
            const percent = getRandomInt(5, 15);
            if (isInterestOnly) {
              const lai = (goc * percent) / 100;
              qs.push(createQuestion(`Mẹ gửi tiết kiệm ${formatNum(goc)} đồng với lãi suất ${percent}% một năm. Hỏi sau 1 năm mẹ được bao nhiêu tiền lãi?`, lai, 'int', 'đồng', `Tiền lãi sau 1 năm là: ${formatNum(goc)} x ${percent} : 100 = ${formatNum(lai)} (đồng).`));
            } else {
              const lai = (goc * percent) / 100;
              const total = goc + lai;
              qs.push(createQuestion(`Một cửa hàng bỏ ra ${formatNum(goc)} đồng tiền vốn để nhập hàng. Cửa hàng bán lãi ${percent}%. Hỏi tiền thu về (cả vốn và lãi) là bao nhiêu?`, total, 'int', 'đồng', `Tiền lãi là: ${formatNum(goc)} x ${percent} : 100 = ${formatNum(lai)} (đồng).\nCả vốn và lãi là: ${formatNum(goc)} + ${formatNum(lai)} = ${formatNum(total)} (đồng).`));
            }
        } else { // Biểu đồ phần trăm
            const p1 = getRandomInt(20, 30);
            const p2 = getRandomInt(30, 40);
            const p3 = 100 - p1 - p2;
            const tree1 = getRandomItem(["Nhãn", "Xoài", "Bưởi", "Cam"]);
            const tree2 = getRandomItem(["Ổi", "Táo", "Mít", "Chôm chôm"]);
            qs.push(createQuestion(`Biểu đồ hình quạt cho biết tỉ lệ cây trong vườn: ${tree1} chiếm ${p1}%, ${tree2} chiếm ${p2}%, còn lại là cây chuối. Hỏi cây chuối chiếm bao nhiêu phần trăm?`, p3, 'int', '%', `Tổng phần trăm của ${tree1} và ${tree2} là: ${p1}% + ${p2}% = ${p1+p2}%.\nCây chuối chiếm: 100% - ${p1+p2}% = ${p3}%.`));
        }
    }
    return shuffleArray(qs);
  },
  chuong6: () => { // Diện tích, thể tích hình hộp, lập phương
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const subtype = (i % 6) + 1;
        if (subtype === 1) { // Hình Lập phương - Không nắp
            const edge = getRandomInt(2, 6);
            const s = edge * edge * 5;
            qs.push(createQuestion(`Người ta làm một cái hộp không có nắp bằng bìa cứng dạng hình lập phương có cạnh ${edge}dm. Diện tích bìa cần dùng là:`, s, 'int', 'dm²', `Hộp không có nắp nên chỉ có 5 mặt.\nDiện tích bìa cần dùng = (cạnh x cạnh) x 5.\nS = (${edge} x ${edge}) x 5 = ${s} dm².`));
        } else if (subtype === 2) { // Hình Lập phương - Stp
            const edge = getRandomInt(2, 6);
            const stp = edge * edge * 6;
            qs.push(createQuestion(`Diện tích toàn phần của một khối gỗ hình lập phương cạnh ${edge}cm là:`, stp, 'int', 'cm²', `Diện tích toàn phần = (cạnh x cạnh) x 6.\nStp = (${edge} x ${edge}) x 6 = ${stp} cm².`));
        } else if (subtype === 3) { // Hình Lập phương - V
            const edge = getRandomInt(2, 6);
            const volume = edge * edge * edge;
            qs.push(createQuestion(`Thể tích của khối dạng hình lập phương có cạnh ${edge}cm là:`, volume, 'int', 'cm³', `Thể tích hình lập phương = cạnh x cạnh x cạnh.\nV = ${edge} x ${edge} x ${edge} = ${volume} cm³.`));
        } else if (subtype === 4) { // Hộp chữ nhật - Bể không nắp
            const l = getRandomInt(5, 10);
            const w = getRandomInt(3, 5);
            const h = getRandomInt(4, 8);
            const sxq = (l + w) * 2 * h;
            const snk = sxq + l * w;
            qs.push(createQuestion(`Một chiếc bể kính nuôi cá (không có nắp) dạng hình hộp chữ nhật dài ${l}dm, rộng ${w}dm, cao ${h}dm. Diện tích kính dùng làm bể là:`, snk, 'int', 'dm²', `Bể không nắp nên chỉ lấy 1 mặt đáy.\nDiện tích kính = Sxq + Diện tích 1 đáy = (dài + rộng) x 2 x cao + (dài x rộng).\nS = (${l} + ${w}) x 2 x ${h} + (${l} x ${w}) = ${sxq} + ${l * w} = ${snk} dm².`));
        } else if (subtype === 5) { // Hộp chữ nhật - Quét vôi
            const l = getRandomInt(6, 12);
            const w = getRandomInt(4, 8);
            const h = getRandomInt(3, 5);
            const door = getRandomInt(5, 10);
            const sxq = (l + w) * 2 * h;
            const ceiling = l * w;
            const stp = sxq + ceiling - door;
            qs.push(createQuestion(`Người ta quét vôi bên trong một căn phòng dạng hình hộp chữ nhật có dài ${l}m, rộng ${w}m, cao ${h}m. Bề mặt quét vôi gồm 4 bức tường và trần nhà. Biết tổng diện tích các cửa là ${door}m². Diện tích cần quét vôi là:`, stp, 'int', 'm²', `Diện tích 4 bức tường (Sxq) = (${l} + ${w}) x 2 x ${h} = ${sxq} m².\nDiện tích trần nhà = ${l} x ${w} = ${ceiling} m².\nDiện tích quét vôi = Sxq + Trần - Cửa = ${sxq} + ${ceiling} - ${door} = ${stp} m².`));
        } else { // Hộp chữ nhật - V
            const l = getRandomInt(5, 10);
            const w = getRandomInt(3, 5);
            const h = getRandomInt(2, 4);
            const volume = l * w * h;
            qs.push(createQuestion(`Một khối hình hộp chữ nhật dài ${l}dm, rộng ${w}dm, cao ${h}dm. Thể tích hình hộp đó là:`, volume, 'int', 'dm³', `Thể tích hình hộp chữ nhật = chiều dài x chiều rộng x chiều cao.\nV = ${l} x ${w} x ${h} = ${volume} dm³.`));
        }
    }
    return shuffleArray(qs);
  },
  chuong7: () => { // Chuyển động đều
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const k = (i % 6) + 1;
        if (k === 1) { 
            const route = getRandomItem(PHUTHO_ROUTES);
            const scenario = getRandomItem(route.scenarios);
            const { v, t, s } = scenario;
            qs.push(createQuestion(`Một xe khách đi từ ${route.from} đến ${route.to} với vận tốc ${v} km/h trong ${formatNum(t)} giờ. Quãng đường là:`, s, 'float', 'km', `Quãng đường = Vận tốc x Thời gian = ${v} x ${formatNum(t)} = ${formatNum(s)} km.`));
        } else if (k === 2) { 
            const h = getRandomInt(1, 3);
            const p = getRandomInt(15, 45);
            const min = h * 60 + p;
            qs.push(createQuestion(`Bác tài xế chạy tuyến đường mất ${h} giờ ${p} phút. Đổi thời gian ra phút ta được:`, min, 'int', 'phút', `${h} giờ = ${h * 60} phút. Vậy ${h} giờ ${p} phút = ${h * 60} + ${p} = ${min} phút.`));
        } else if (k === 3) {
            const isAdd = Math.random() < 0.5;
            if (isAdd) {
              const h1 = getRandomInt(1, 3); const m1 = getRandomInt(10, 45);
              const h2 = getRandomInt(1, 2); const m2 = getRandomInt(20, 50);
              let totalM = m1 + m2;
              let carry = 0;
              if (totalM >= 60) {
                totalM -= 60;
                carry = 1;
              }
              const totalH = h1 + h2 + carry;
              qs.push(createQuestion(`Tính: ${h1} giờ ${m1} phút + ${h2} giờ ${m2} phút (chỉ điền số giờ của kết quả sau khi đã đổi đơn vị lớn nhất):`, totalH, 'int', 'giờ', `${h1} giờ ${m1} phút + ${h2} giờ ${m2} phút = ${h1+h2} giờ ${m1+m2} phút.${carry ? `\nĐổi ${m1+m2} phút = 1 giờ ${totalM} phút.\nNên kết quả là ${totalH} giờ ${totalM} phút.` : ""}\nĐề bài chỉ hỏi số giờ, do đó đáp án là ${totalH}.`));
            } else {
              const h1 = getRandomInt(3, 5); const m1 = getRandomInt(10, 30);
              const h2 = getRandomInt(1, 2); const m2 = getRandomInt(35, 55);
              const hDiff = (h1 - 1) - h2;
              const mDiff = (m1 + 60) - m2;
              qs.push(createQuestion(`Tính: ${h1} giờ ${m1} phút - ${h2} giờ ${m2} phút. Kết quả còn lại số phút là:`, mDiff, 'int', 'phút', `Do ${m1} phút nhỏ hơn ${m2} phút nên ta mượn 1 giờ: ${h1} giờ ${m1} phút = ${h1-1} giờ ${m1+60} phút.\n${h1-1} giờ ${m1+60} phút - ${h2} giờ ${m2} phút = ${hDiff} giờ ${mDiff} phút.\nĐáp án hỏi số phút là ${mDiff}.`));
            }
        } else if (k === 4) {
            const isMul = Math.random() < 0.5;
            if (isMul) {
              const h = getRandomInt(1, 2); const m = getRandomInt(10, 20);
              const factor = getRandomInt(2, 4);
              const totalM = (h * 60 + m) * factor;
              qs.push(createQuestion(`Một ca nô đi 1 vòng hồ hết ${h} giờ ${m} phút. Hỏi đi ${factor} vòng như thế thì hết tổng cộng bao nhiêu phút?`, totalM, 'int', 'phút', `1 vòng hồ hết ${h} giờ ${m} phút = ${h * 60 + m} phút.\nVậy ${factor} vòng hết: ${h * 60 + m} x ${factor} = ${totalM} phút.`));
            } else {
              const h = getRandomInt(2, 4); const m = getRandomInt(30, 50);
              const totalMin = h * 60 + m;
              const div = getRandomInt(2, 3);
              const targetTotalMin = Math.floor(totalMin / div) * div; // Ensure divisible
              const newH = Math.floor(targetTotalMin / 60);
              const newM = targetTotalMin % 60;
              const ansMin = targetTotalMin / div;
              qs.push(createQuestion(`Một máy bơm hoạt động trong ${newH} giờ ${newM} phút thì bơm đầy ${div} bể nước bằng nhau. Hỏi bơm 1 bể như thế hết bao nhiêu phút?`, ansMin, 'int', 'phút', `Thời gian bơm ${div} bể: ${newH} giờ ${newM} phút = ${targetTotalMin} phút.\nBơm 1 bể hết: ${targetTotalMin} : ${div} = ${ansMin} phút.`));
            }
        } else if (k === 5) {
            const route = getRandomItem(PHUTHO_ROUTES);
            const scenario = getRandomItem(route.scenarios);
            const { v, t, s } = scenario;
            qs.push(createQuestion(`Một xe ô tô đi từ ${route.from} đến ${route.to} với vận tốc ${v} km/h. Quãng đường dài ${s} km. Hỏi Thời gian xe đi hết quãng đường đó là:`, t, 'float', 'giờ', `Thời gian = Quãng đường : Vận tốc = ${s} : ${v} = ${formatNum(t)} giờ.`));
        } else {
            const route = getRandomItem(PHUTHO_ROUTES);
            const scenario = getRandomItem(route.scenarios);
            const { v, t, s } = scenario;
            qs.push(createQuestion(`Một xe tải đi quãng đường từ ${route.from} đến ${route.to} dài ${s} km trong thời gian ${formatNum(t)} giờ. Hỏi vận tốc của xe tải là bao nhiêu?`, v, 'float', 'km/h', `Vận tốc = Quãng đường : Thời gian = ${s} : ${formatNum(t)} = ${formatNum(v)} km/h.`));
        }
    }
    return shuffleArray(qs);
  },
  chuong8: () => { // Thống kê, xác suất
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const type = getRandomInt(1, 2);
        if (type === 1) { 
            const a = getRandomInt(10, 20);
            const b = getRandomInt(5, 15);
            const total = a + b;
            qs.push(createQuestion(`Lớp 5A có ${a} học sinh nam và ${b} học sinh nữ. Tổng số học sinh mà biểu đồ cột biểu diễn cho lớp 5A là:`, total, 'int', 'bạn', `Tổng: ${a} + ${b} = ${total} bạn.`));
        } else { 
            const t = getRandomInt(5, 10);
            const c = getRandomInt(1, t-1);
            const r = parseFloat((c/t).toFixed(2));
            qs.push(createQuestion(`Tung đồng xu ${t} lần, có ${c} lần mặt sấp. Tỉ số của số lần xuất hiện mặt sấp so với tổng số lần tung là:`, r, 'float', '', `Tỉ số: ${c} : ${t} = ${formatNum(r)}.`));
        }
    }
    return qs;
  }
};

// --- DỮ LIỆU LÝ THUYẾT (TĨNH) ---

const CHAPTER_CONTENT: Record<string, ChapterData> = {
  chuong1: {
    id: 'chuong1', title: '1. Số thập phân', icon: '1️⃣', desc: 'Khái niệm, Đọc viết, tính chất, so sánh.', theory: [
      { type: 'header', content: '1. Khái niệm' },
      { type: 'text', content: 'Mỗi số thập phân gồm hai phần: phần nguyên và phần thập phân.' },
      { type: 'header', content: '2. So sánh' },
      { type: 'box', content: 'Bước 1: So sánh phần nguyên trước.\nBước 2: Nếu phần nguyên bằng nhau, so sánh hàng phần mười, đến phần trăm...', title: 'Quy tắc' }
    ]
  },
  chuong2: {
    id: 'chuong2', title: '2. Đơn vị đo đại lượng', icon: '2️⃣', desc: 'Diện tích (km², hecta) và Thể tích (cm³, dm³, m³).', theory: [
      { type: 'header', content: '1. Đơn vị diện tích' },
      { type: 'text', content: '1 ki-lô-mét vuông (km²) = 100 héc-ta (ha)\n1 héc-ta (ha) = 10 000 mét vuông (m²)' },
      { type: 'header', content: '2. Đơn vị thể tích' },
      { type: 'box', content: '1 m³ = 1000 dm³ = 1 000 000 cm³\n1 dm³ = 1 lít', title: 'Ghi nhớ thể tích' }
    ]
  },
  chuong3: {
    id: 'chuong3', title: '3. Phép tính số thập phân', icon: '3️⃣', desc: 'Cộng, trừ, nhân, chia số thập phân.', theory: [
      { type: 'header', content: '1. Cộng, trừ' },
      { type: 'box', content: 'Đặt tính sao cho các dấu phẩy thẳng cột. Cộng/trừ như số tự nhiên.', title: 'Lưu ý' },
      { type: 'header', content: '2. Nhân, chia' },
      { type: 'text', content: 'Đếm chữ số phần thập phân của cả hai thừa số khi nhân. Khi chia, dời dấu phẩy của số bị chia sang phải bằng số chữ số thập phân ở số chia.' }
    ]
  },
  chuong4: {
    id: 'chuong4', title: '4. Hình học phẳng', icon: '4️⃣', desc: 'Hình tam giác, Hình thang, Hình tròn.', theory: [
      { type: 'header', content: '1. Hình tam giác' },
      { type: 'box', content: 'Diện tích S = (đáy x chiều cao) : 2', title: 'Tam giác' },
      { type: 'header', content: '2. Hình thang' },
      { type: 'box', content: 'Diện tích S = (đáy lớn + đáy bé) x chiều cao : 2', title: 'Hình thang' },
      { type: 'header', content: '3. Hình tròn' },
      { type: 'box', content: 'Chu vi C = d x 3,14\nDiện tích S = r x r x 3,14', title: 'Hình tròn' }
    ]
  },
  chuong5: {
    id: 'chuong5', title: '5. Tỉ số phần trăm', icon: '5️⃣', desc: 'Tỉ số %, Tỉ lệ bản đồ, Tìm 2 số khi biết tổng-hiệu và tỉ số.', theory: [
      { type: 'header', content: '1. Khái niệm và tính toán phần trăm' },
      { type: 'box', content: '- Tỉ số phần trăm: Những phân số có mẫu số là 100 có thể viết dưới dạng tỉ số phần trăm. Ví dụ: 25/100 = 25%\n- Tìm tỉ số phần trăm của 2 số: Lấy số thứ nhất chia cho số thứ hai, nhân nhẩm với 100 rồi viết thêm kí hiệu %.\n- Tìm phần trăm của 1 số: Muốn tìm a% của B, ta lấy B x a : 100 (hoặc B : 100 x a).', title: 'Tỉ số phần trăm' },
      { type: 'header', content: '2. Tỉ lệ bản đồ' },
      { type: 'box', content: 'Độ dài thật = Độ dài trên bản đồ x Mẫu số tỉ lệ.\n(Chú ý: Cần đổi về cùng đơn vị đo trước khi tính toán)', title: 'Tỉ lệ bản đồ' },
      { type: 'header', content: '3. Toán Tổng - Tỉ, Hiệu - Tỉ' },
      { type: 'box', content: 'Tìm 2 số khi biết tổng và tỉ số:\n- Bước 1: Tìm tổng số phần bằng nhau.\n- Bước 2:\n  + Số bé = (Tổng : Tổng số phần) x Số phần của số bé.\n  + Số lớn = Tổng - Số bé (hoặc Số lớn = Giá trị 1 phần x Số phần của số lớn).\n\nTìm 2 số khi biết hiệu và tỉ số:\n- Bước 1: Tìm hiệu số phần bằng nhau.\n- Bước 2:\n  + Số bé = (Hiệu : Hiệu số phần) x Số phần của số bé.\n  + Số lớn = Số bé + Hiệu (hoặc Số lớn = Giá trị 1 phần x Số phần của số lớn).', title: 'Tổng/Hiệu - Tỉ' }
    ]
  },
  chuong6: {
    id: 'chuong6', title: '6. Diện tích, Thể tích hình khối', icon: '6️⃣', desc: 'Diện tích xung quanh, toàn phần và thể tích Hình lập phương, Hình hộp chữ nhật.', theory: [
      { type: 'header', content: '1. Hình hộp chữ nhật' },
      { type: 'box', content: '- Diện tích xung quanh: Sxq = Chu vi đáy x cao = (dài + rộng) x 2 x cao\n- Diện tích toàn phần: Stp = Sxq + Diện tích 2 mặt đáy = Sxq + (dài x rộng) x 2\n- Thể tích: V = dài x rộng x cao', title: 'Hình hộp chữ nhật' },
      { type: 'header', content: '2. Hình lập phương' },
      { type: 'box', content: '- Diện tích xung quanh: Sxq = Diện tích 1 mặt x 4 = (cạnh x cạnh) x 4\n- Diện tích toàn phần: Stp = Diện tích 1 mặt x 6 = (cạnh x cạnh) x 6\n- Thể tích: V = cạnh x cạnh x cạnh', title: 'Hình lập phương' }
    ]
  },
  chuong7: {
    id: 'chuong7', title: '7. Chuyển động đều', icon: '7️⃣', desc: 'Đơn vị đo thời gian, Bài toán về chuyển động đều.', theory: [
      { type: 'header', content: '1. Đơn vị đo thời gian và phép tính' },
      { type: 'box', content: '- Các đơn vị: 1 năm = 12 tháng, 1 ngày = 24 giờ, 1 giờ = 60 phút, 1 phút = 60 giây.\n- Cộng, trừ số đo thời gian: Đặt tính thẳng cột theo từng đơn vị. Cộng (hoặc trừ) từng loại đơn vị. Nếu số phút (hoặc giây) ở kết quả từ 60 trở lên, ta đổi sang đơn vị lớn hơn liền kề.\n- Nhân, chia số đo thời gian: Thực hiện với từng loại đơn vị đo từ trái sang phải (hoặc tương tự như số thập phân rồi đổi đơn vị).', title: 'Thời gian' },
      { type: 'header', content: '2. Công thức chuyển động' },
      { type: 'box', content: '- Vận tốc: v = s : t  (s là quãng đường, t là thời gian)\n- Quãng đường: s = v x t\n- Thời gian: t = s : v\n(Lưu ý: Đơn vị của v phụ thuộc vào đơn vị của s và t)', title: 'Công thức chuyển động' }
    ]
  },
  chuong8: {
    id: 'chuong8', title: '8. Thống kê, xác suất', icon: '8️⃣', desc: 'Thu thập, sắp xếp số liệu, Các loại biểu đồ, Tỉ số lặp lại.', theory: [
      { type: 'header', content: '1. Thu thập & biểu đồ' },
      { type: 'text', content: 'Sắp xếp dữ liệu gọn gàng và biểu diễn trên biểu đồ tranh hoặc biểu đồ cột.' },
      { type: 'header', content: '2. Sự kiện lặp lại' },
      { type: 'box', content: 'Tỉ số = Số lần xảy ra sự kiện : Tổng số lần thực hiện.', title: 'Tỉ số lặp lại' }
    ]
  }
};

// --- COMPONENTS ---

const Navbar = ({ goHome }: { goHome: () => void }) => {
  return (
    <nav style={{
      background: 'linear-gradient(to right, #f43f5e, #fb923c)',
      padding: '15px 30px',
      boxShadow: '0 8px 0 rgba(244, 63, 94, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '4px solid white'
    }}>
      <div 
        onClick={goHome} 
        style={{ color: 'white', fontWeight: '900', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textShadow: '2px 2px 0 #e11d48' }}
      >
        <span style={{ fontSize: '2.2rem' }}>🏫</span>
        <span className="floating" style={{ display: 'inline-block' }}>Lớp Học Toán 5</span>
      </div>
      <button 
        className="fun-btn"
        onClick={goHome}
        style={{
          background: '#fef08a',
          color: '#b45309',
          padding: '10px 20px',
          borderRadius: '30px',
          cursor: 'pointer',
          fontWeight: '900',
          fontSize: '1.1rem',
          border: 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}
      >
        🏠 Trang Chủ
      </button>
    </nav>
  );
};

const TheoryView = ({ chapter, onStartQuiz }: { chapter: ChapterData, onStartQuiz: () => void }) => (
  <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px' }}>
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <h1 className="cloud-title" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{chapter.title}</h1>
      <p style={{ color: '#64748b', fontSize: '1.2rem', marginTop: '15px', fontWeight: 'bold' }}>{chapter.desc}</p>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {chapter.theory.map((item, index) => {
        switch (item.type) {
          case 'header':
            return (
              <div key={index} style={{ 
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)', 
                color: 'white', 
                padding: '15px 25px', 
                borderRadius: '15px', 
                boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)',
                marginTop: index === 0 ? '0' : '25px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{item.content}</h2>
              </div>
            );
          case 'box':
            const isBlue = index % 2 === 0;
            return (
              <div key={index} style={{ 
                background: isBlue ? '#f0f9ff' : '#fdf4ff', 
                border: isBlue ? '2px dashed #38bdf8' : '2px dashed #e879f9', 
                borderRadius: '15px', 
                padding: '25px', 
                margin: '5px 0' 
              }}>
                <strong style={{ 
                  color: isBlue ? '#0284c7' : '#c026d3', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '15px',
                  fontSize: '1.3rem',
                  textTransform: 'uppercase'
                }}>
                  <span>{isBlue ? '💡' : '📌'}</span> {item.title || 'Ghi nhớ'}
                </strong>
                <div style={{ whiteSpace: 'pre-line', fontSize: '1.15rem', lineHeight: '1.8', color: '#334155', fontWeight: '500' }}>
                  {item.content}
                </div>
              </div>
            );
          case 'example':
            return (
              <div key={index} style={{ 
                background: '#f8fafc', 
                borderLeft: '6px solid #10b981', 
                padding: '20px', 
                borderRadius: '0 15px 15px 0',
                margin: '5px 0', 
                color: '#0f172a',
                boxShadow: '0 3px 6px rgba(0,0,0,0.05)'
              }}>
                <strong style={{ color: '#059669', marginRight: '8px', fontSize: '1.1rem' }}>✍️ Ví dụ:</strong> 
                <span style={{ whiteSpace: 'pre-line', fontStyle: 'italic', fontSize: '1.1rem' }}>{item.content}</span>
              </div>
            );
          default:
            return (
              <div key={index} style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px', 
                boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
                lineHeight: '1.7', 
                fontSize: '1.15rem', 
                color: '#334155',
                border: '1px solid #e2e8f0'
              }}>
                {item.content}
              </div>
            );
        }
      })}
    </div>

    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <button 
        className="fun-btn"
        onClick={onStartQuiz}
        style={{
          background: 'linear-gradient(to right, #ec4899, #f43f5e)',
          color: 'white',
          border: 'none',
          padding: '18px 60px',
          fontSize: '1.6rem',
          fontWeight: '900',
          borderRadius: '50px',
          cursor: 'pointer',
        }}
      >
        Làm bài tập vận dụng ngay 🚀
      </button>
    </div>
  </div>
);

const QuizView = ({ questions, title, onRetry }: { questions: Question[], title: string, onRetry: () => void }) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId: number, optionIndex: number) => {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correct) score++;
    });
    return score;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const getFeedbackMessage = (score: number) => {
    if (score === 10) return "Tuyệt vời quá! Em đạt điểm tối đa rồi, thầy rất tự hào về em! 🌟";
    if (score >= 8) return "Rất giỏi! Em làm bài rất tốt, cố gắng phát huy nhé! 👍";
    if (score >= 5) return "Em làm khá tốt! Hãy xem lại các câu sai để rút kinh nghiệm nhé, thầy tin lần sau em sẽ làm tốt hơn! 💪";
    return "Không sao đâu, quan trọng là em đã cố gắng! Hãy ôn lại lý thuyết và làm lại bài nhé, thầy luôn ủng hộ em! ❤️";
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
      <div style={{ background: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 8px 0 #bae6fd', marginBottom: '30px', border: '4px solid #38bdf8', textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#0369a1', fontSize: '2rem', fontWeight: '900' }}>⭐ Bài tập tự luyện ⭐</h2>
        <h3 style={{ margin: '10px 0', color: '#0ea5e9', fontSize: '1.4rem' }}>{title}</h3>
        <p style={{ margin: '10px 0 0', color: '#64748b', fontWeight: 'bold' }}>Em hãy suy nghĩ thật kĩ nhé!</p>
      </div>

      {questions.map((q, index) => {
        const isCorrect = userAnswers[q.id] === q.correct;
        let bgColor = '#fff';
        if (submitted) {
          bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';
        }

        return (
          <div key={q.id} style={{ 
            background: bgColor, 
            padding: '25px', 
            borderRadius: '20px', 
            marginBottom: '30px',
            border: submitted ? (isCorrect ? '4px solid #4ade80' : '4px solid #f87171') : '4px solid #e2e8f0',
            boxShadow: '0 8px 0 rgba(0,0,0,0.05)',
            position: 'relative'
          }}>
            {submitted && isCorrect && <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3rem', animation: 'pulse-spin 2s infinite linear' }}>🌟</div>}
            {submitted && !isCorrect && <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3rem' }}>❌</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span className="cloud-title" style={{ padding: '5px 20px', fontSize: '1.2rem', margin: 0 }}>Câu {index + 1}</span>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', lineHeight: '1.6' }}>{q.question}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px' }}>
              {q.options.map((opt, optIdx) => (
                <label 
                  key={optIdx} 
                  className={!submitted ? "fun-btn" : ""}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '15px', 
                    borderRadius: '15px',
                    border: submitted 
                      ? (optIdx === q.correct ? '3px solid #22c55e' : (userAnswers[q.id] === optIdx ? '3px solid #ef4444' : '3px solid #cbd5e1'))
                      : (userAnswers[q.id] === optIdx ? '3px solid #0ea5e9' : '3px solid #cbd5e1'),
                    cursor: submitted ? 'default' : 'pointer',
                    background: submitted
                      ? (optIdx === q.correct ? '#dcfce7' : (userAnswers[q.id] === optIdx ? '#fee2e2' : 'white'))
                      : (userAnswers[q.id] === optIdx ? '#e0f2fe' : 'white'),
                    fontWeight: (submitted && optIdx === q.correct) || (!submitted && userAnswers[q.id] === optIdx) ? '900' : '600',
                    color: submitted
                      ? (optIdx === q.correct ? '#166534' : (userAnswers[q.id] === optIdx ? '#991b1b' : '#475569'))
                      : (userAnswers[q.id] === optIdx ? '#0369a1' : '#475569'),
                    fontSize: '1.2rem',
                    transition: 'all 0.2s',
                    boxShadow: !submitted ? 'none' : 'none',
                  }}
                >
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    checked={userAnswers[q.id] === optIdx} 
                    onChange={() => handleSelect(q.id, optIdx)}
                    disabled={submitted}
                    style={{ width: '25px', height: '25px', marginRight: '15px', accentColor: submitted ? (optIdx === q.correct ? '#22c55e' : '#ef4444') : '#0ea5e9' }}
                  />
                  <span>{opt}</span>
                  {submitted && optIdx === q.correct && (
                    <span style={{ marginLeft: 'auto', color: '#166534', fontWeight: 'bold' }}>✓</span>
                  )}
                  {submitted && userAnswers[q.id] === optIdx && optIdx !== q.correct && (
                    <span style={{ marginLeft: 'auto', color: '#991b1b', fontWeight: 'bold' }}>✗</span>
                  )}
                </label>
              ))}
            </div>
            {submitted && userAnswers[q.id] !== q.correct && q.explanation && (
              <div style={{ marginTop: '25px', padding: '20px', background: '#fef08a', border: '3px solid #eab308', borderRadius: '15px', color: '#854d0e', display: 'flex', gap: '15px', alignItems: 'start', fontSize: '1.1rem' }}>
                <span style={{ fontSize: '2rem' }}>💡</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', color: '#713f12' }}>Hướng dẫn giải chi tiết:</strong>
                  <span style={{ whiteSpace: 'pre-line', fontWeight: '600' }}>{q.explanation}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '50px' }}>
        {!submitted ? (
          <button 
            className={Object.keys(userAnswers).length < 10 ? "" : "fun-btn"}
            onClick={handleSubmit}
            disabled={Object.keys(userAnswers).length < 10}
            style={{
              background: Object.keys(userAnswers).length < 10 ? '#cbd5e1' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '18px 60px',
              fontSize: '1.6rem',
              fontWeight: '900',
              borderRadius: '50px',
              cursor: Object.keys(userAnswers).length < 10 ? 'not-allowed' : 'pointer',
            }}
          >
            {Object.keys(userAnswers).length < 10 ? `Đã làm ${Object.keys(userAnswers).length}/10 câu` : '✅ Chấm điểm ngay!'}
          </button>
        ) : (
          <div style={{ background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 0 #bae6fd', border: '4px solid #38bdf8' }}>
            <h2 style={{ fontSize: '3rem', color: '#f43f5e', margin: '0 0 10px 0', fontWeight: '900' }}>⭐ Khám phá kết quả ⭐</h2>
            <div style={{ fontSize: '4rem', fontWeight: '900', color: '#10b981', margin: '20px 0' }}>{calculateScore()}/10</div>
            <p style={{ fontSize: '1.4rem', color: '#0369a1', fontWeight: 'bold', margin: '15px 0' }}>
              {getFeedbackMessage(calculateScore())}
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
              <button 
                className="fun-btn"
                onClick={onRetry} 
                style={{ 
                  padding: '15px 40px', 
                  borderRadius: '50px', 
                  border: 'none', 
                  background: '#f59e0b', 
                  color: 'white', 
                  fontWeight: '900', 
                  cursor: 'pointer', 
                  fontSize: '1.4rem'
                }}
              >
                🔄 Học chương khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChapterCard: React.FC<{ chapter: ChapterData, onClick: () => void, index: number }> = ({ chapter, onClick, index }) => {
  const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#eab308'];
  const color = colors[index % colors.length];
  return (
    <div 
      className="fun-card"
      onClick={onClick}
      style={{ 
        background: 'white', 
        borderRadius: '25px', 
        padding: '30px 20px', 
        cursor: 'pointer',
        boxShadow: `0 8px 0 ${color}40`,
        border: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `${color}20`, borderRadius: '50%' }}></div>
      <div style={{ fontSize: '4.5rem', marginBottom: '15px', position: 'relative', zIndex: 2 }}>{chapter.icon}</div>
      <h3 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: '800' }}>{chapter.title}</h3>
      <p style={{ color: '#64748b', fontSize: '1rem', margin: 0, fontWeight: '600' }}>{chapter.desc}</p>
      <div style={{ marginTop: '20px', background: `${color}20`, color: color, padding: '8px 20px', borderRadius: '20px', fontWeight: '800', border: `2px solid ${color}` }}>
        Học ngay! 🚀
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'theory' | 'quiz'>('theory');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  const handleStartQuiz = (chapterId: string) => {
    // Gọi hàm sinh đề ngẫu nhiên từ Generators
    const genFn = Generators[chapterId as keyof typeof Generators];
    if (genFn) {
      const uniqueQs = new Map<string, Question>();
      let attempts = 0;
      while (uniqueQs.size < 10 && attempts < 50) {
        const batch = genFn();
        batch.forEach(q => {
          if (!uniqueQs.has(q.question) && uniqueQs.size < 10) {
            uniqueQs.set(q.question, q);
          }
        });
        attempts++;
      }
      setQuizQuestions(Array.from(uniqueQs.values()));
      setViewMode('quiz');
      window.scrollTo(0, 0);
    }
  };

  const activeChapterData = currentChapterId ? CHAPTER_CONTENT[currentChapterId] : null;

  return (
    <div className="pattern-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{ __html: FUN_STYLES }} />
      <Navbar goHome={() => { setCurrentChapterId(null); setViewMode('theory'); }} />
      
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {!activeChapterData ? (
          // HOME PAGE GRID
          <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div className="cloud-title">
                <h1 style={{ fontSize: '3rem', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>Toán Lớp 5 ✨</h1>
                <p style={{ color: '#64748b', fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Ôn tập siêu vui - Điểm 10 dễ ợt!</p>
              </div>
            </div>
            
            <div className="chapters-grid">
              {Object.values(CHAPTER_CONTENT).map((chapter, index) => (
                <ChapterCard key={chapter.id} chapter={chapter} index={index} onClick={() => setCurrentChapterId(chapter.id)} />
              ))}
            </div>
          </div>
        ) : (
          // CHAPTER VIEW
          <>
            {viewMode === 'theory' && (
              <TheoryView 
                chapter={activeChapterData} 
                onStartQuiz={() => handleStartQuiz(activeChapterData.id)} 
              />
            )}
            {viewMode === 'quiz' && (
              <QuizView 
                questions={quizQuestions}
                title={activeChapterData.title}
                onRetry={() => { setCurrentChapterId(null); setViewMode('theory'); }} 
              />
            )}
          </>
        )}
      </main>

      <footer style={{ 
        backgroundColor: '#1e293b', 
        color: '#94a3b8', 
        textAlign: 'center', 
        padding: '25px',
        marginTop: 'auto'
      }}>
        <p style={{ fontWeight: 'bold', color: 'white' }}>© 2026 Lớp Học Toán 5</p>
        <p style={{ fontSize: '0.9rem' }}>Nội dung được biên soạn dựa trên bộ sách Kết nối tri thức với cuộc sống.</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);

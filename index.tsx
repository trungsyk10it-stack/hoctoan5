import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

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
  return num.toString().replace('.', ',');
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
  "Bưởi Đoan Hùng", "Thịt chua Thanh Sơn", "Chè Long Cốc", 
  "Gạo nếp gà gáy Mỹ Lung", "Cá thính Tử Đà", "Bánh chưng Đất Tổ", 
  "Cọ ẻo Phú Thọ", "Hồng Hạc Trì"
];

const PHUTHO_ROUTES = [
  { from: "thành phố Việt Trì", to: "huyện Đoan Hùng" },
  { from: "huyện Lâm Thao", to: "thành phố Việt Trì" },
  { from: "thị xã Phú Thọ", to: "huyện Thanh Sơn" },
  { from: "huyện Tân Sơn", to: "huyện Thanh Thủy" },
  { from: "ngã ba Hàng Đồi", to: "Đền Hùng" }
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- BỘ MÁY SINH CÂU HỎI (GENERATORS) ---

const Generators = {
  chuong1: () => { // Phân số & Hỗn số
    const types = [
      () => { // Hỗn số -> Phân số
        const int = getRandomInt(1, 5);
        const num = getRandomInt(1, 4);
        const den = getRandomInt(num + 1, 9);
        const correctNum = int * den + num;
        return {
          id: Math.random(),
          question: `Hỗn số ${int} ${num}/${den} được viết dưới dạng phân số là:`,
          options: shuffleArray([`${correctNum}/${den}`, `${int*den}/${num}`, `${correctNum}/${int}`, `${num}/${den}`]),
          correct: 0,
          explanation: `Muốn chuyển hỗn số thành phân số, ta lấy phần nguyên nhân với mẫu số rồi cộng với tử số để làm tử số mới, giữ nguyên mẫu số.\nTa có: ${int} x ${den} + ${num} = ${correctNum}.\nVậy hỗn số chuyển thành: ${correctNum}/${den}.`
        };
      },
      () => { // Phân số -> Số thập phân
        const num = getRandomInt(1, 9);
        const den = Math.random() > 0.5 ? 10 : 100;
        const val = num / den;
        return createQuestion(`Phân số ${num}/${den} viết dưới dạng số thập phân là:`, val, 'float', '', `Ta lấy tử số chia cho mẫu số: ${num} : ${den} = ${formatNum(val)}.`);
      },
      () => { // Cộng 2 phân số đơn giản (cùng mẫu hoặc khác mẫu đơn giản)
        const den = getRandomInt(2, 9);
        const n1 = getRandomInt(1, den - 1);
        const n2 = getRandomInt(1, den - 1);
        const x = getRandomInt(1, 10);
        const result = parseFloat(((n1+n2)/10).toFixed(1));
        return createQuestion(`Tìm x biết: x - ${formatNum(n1/10)} = ${formatNum(n2/10)}`, result, 'float', '', `Muốn tìm số bị trừ x, ta lấy hiệu cộng với số trừ.\nx = ${formatNum(n2/10)} + ${formatNum(n1/10)} = ${formatNum(result)}.`);
      },
      () => { // Lời văn
        const total = getRandomInt(3, 5) * 10; // Lớp học khoảng 30-50 học sinh
        const part = getRandomInt(1, 9);
        const val = (total * part) / 10;
        const location = getRandomItem(PHUTHO_LOCATIONS);
        return createQuestion(`Một đoàn học sinh tỉnh Phú Thọ đi tham quan ${location} có ${total} bạn. Số bạn nữ chiếm ${part}/10 số học sinh cả đoàn. Hỏi đoàn có bao nhiêu bạn nữ?`, val, 'int', 'bạn', `Số bạn nữ là:\n${total} x ${part} : 10 = ${val} (bạn).`);
      }
    ];
    // Fix logic shuffle options cho Hỗn số:
    const q1 = types[0]();
    const correctOpt = q1.options[0]; 
    q1.options = shuffleArray(q1.options);
    q1.correct = q1.options.indexOf(correctOpt);
    
    const questions: Question[] = [q1];
    for(let i=0; i<9; i++) {
        const typeIdx = getRandomInt(1, 3);
        questions.push(types[typeIdx]());
    }
    return questions;
  },

  chuong2: () => { // Số thập phân
    const qs: Question[] = [];
    for (let i = 0; i < 10; i++) {
      const type = getRandomInt(1, 4);
      if (type === 1) { // Giá trị theo hàng
        const a = getRandomInt(1, 9);
        const b = getRandomInt(0, 9);
        const c = getRandomInt(0, 9);
        const numStr = `1${a},${b}${c}5`;
        qs.push({
          id: Math.random(),
          question: `Trong số thập phân ${numStr}, chữ số ${c} thuộc hàng nào?`,
          options: shuffleArray(["Hàng phần mười", "Hàng phần trăm", "Hàng phần nghìn", "Hàng đơn vị"]),
          correct: -1,
          explanation: `Trong số thập phân ${numStr}:\n- Chữ số 1 thuộc hàng chục.\n- Chữ số ${a} thuộc hàng đơn vị.\n- Chữ số ${b} thuộc hàng phần mười.\n- Chữ số ${c} thuộc hàng phần trăm.\n- Chữ số 5 thuộc hàng phần nghìn.`
        });
        const opts = qs[i].options;
        const correctTxt = "Hàng phần trăm";
        qs[i].correct = opts.indexOf(correctTxt);
      } else if (type === 2) { // So sánh
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
        qs[i].correct = qs[i].options.indexOf(formatNum(target));
      } else if (type === 3) { // Làm tròn
        const num = getRandomFloat(10, 99, 2); 
        const rounded = Math.round(num);
        qs.push(createQuestion(`Làm tròn số ${formatNum(num)} (diện tích một đồi chè ở Tân Sơn tính bằng ha) đến hàng đơn vị ta được:`, rounded, 'int', 'ha', `Hàng phần mười của ${formatNum(num)} là ${Math.floor((num * 10) % 10)}.\nNếu hàng phần mười >= 5 thì làm tròn lên, < 5 thì làm tròn xuống.\nVậy ${formatNum(num)} làm tròn thành ${rounded}.`));
      } else { // Đổi đơn vị
        const m = getRandomInt(3, 8);
        const cm = getRandomInt(10, 99);
        const val = parseFloat(`${m}.${cm}`); 
        const correctVal = m + cm/100;
        const tree = getRandomItem(["Cây Cọ", "Cây Keo", "Cây Mỡ", "Cây Bưởi"]);
        qs.push(createQuestion(`Một ${tree} ở vùng đồi Phú Thọ cao ${m}m ${cm}cm. Chiều cao của cây viết dưới dạng số thập phân là ... m`, correctVal, 'float', 'm', `Ta có: ${cm}cm = ${cm}/100 m = ${formatNum(cm/100)}m.\nVậy ${m}m ${cm}cm = ${m}m + ${formatNum(cm/100)}m = ${formatNum(correctVal)}m.`));
      }
    }
    return qs;
  },

  chuong3: () => { // Phép tính
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const op = getRandomInt(1, 4);
        const a = getRandomFloat(10, 50, 1);
        const b = getRandomFloat(1, 9, 1);
        let ans = 0;
        let label = "";
        
        if (op === 1) { label = "+"; ans = a + b; }
        else if (op === 2) { label = "-"; ans = a - b; }
        else if (op === 3) { label = "x"; ans = a * b; } 
        else { 
            const res = getRandomFloat(2, 10, 1);
            const div = getRandomInt(2, 5);
            const dividend = res * div;
            label = ":"; 
            ans = res;
            qs.push(createQuestion(`Kết quả phép tính: ${formatNum(parseFloat(dividend.toFixed(2)))} : ${div} = ?`, ans, 'float', '', `Ta thực hiện phép chia: ${formatNum(parseFloat(dividend.toFixed(2)))} : ${div} = ${formatNum(ans)}.`));
            continue;
        }
        
        ans = parseFloat(ans.toFixed(2));
        
        if (Math.random() < 0.3) { // Bài toán lời văn mua bán
            const price = getRandomInt(25, 60) * 1000; 
            const quantity = getRandomFloat(2, 10, 1);
            const total = price * quantity;
            const product = getRandomItem(PHUTHO_SPECIALTIES);
            qs.push(createQuestion(`Mua ${formatNum(quantity)} kg ${product} (đặc sản Phú Thọ) với giá ${formatNum(price)} đồng/kg thì hết bao nhiêu tiền?`, total, 'int', 'đồng', `Số tiền phải trả là:\n${formatNum(price)} x ${formatNum(quantity)} = ${formatNum(total)} (đồng).`));
        } else {
            qs.push(createQuestion(`Tính: ${formatNum(a)} ${label} ${formatNum(b)} = ?`, ans, 'float', '', `Kết quả: ${formatNum(a)} ${label} ${formatNum(b)} = ${formatNum(ans)}.`));
        }
    }
    return qs;
  },

  chuong4: () => { // Hình học
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const type = getRandomInt(1, 3);
        if (type === 1) { // Tam giác
            const a = getRandomFloat(10, 50, 1);
            const h = getRandomFloat(5, 20, 1);
            const s = (a * h) / 2;
            const context = getRandomItem(["Một mảnh đất trồng chè ở Tân Sơn", "Một vườn hoa ở công viên Văn Lang", "Một thửa ruộng ở Thanh Sơn"]);
            qs.push(createQuestion(`${context} hình tam giác có độ dài đáy ${formatNum(a)}m và chiều cao ${formatNum(h)}m. Diện tích là:`, parseFloat(s.toFixed(2)), 'float', 'm²', `Diện tích hình tam giác = (đáy x chiều cao) : 2.\nS = (${formatNum(a)} x ${formatNum(h)}) : 2 = ${formatNum(parseFloat(s.toFixed(2)))} (m²).`));
        } else if (type === 2) { // Hình tròn
            const r = getRandomInt(30, 80); 
            if (Math.random() > 0.5) {
                const s = r * r * 3.14;
                qs.push(createQuestion(`Mặt trống đồng Ngọc Lũ (biểu tượng văn hóa Hùng Vương) hình tròn có bán kính r = ${r}cm. Diện tích mặt trống là:`, parseFloat(s.toFixed(2)), 'float', 'cm²', `Diện tích hình tròn = r x r x 3,14.\nS = ${r} x ${r} x 3,14 = ${formatNum(parseFloat(s.toFixed(2)))} (cm²).`));
            } else {
                const d = r * 2;
                const c = d * 3.14;
                qs.push(createQuestion(`Một chiếc nón lá (làng nghề Sai Nga) có vành nón hình tròn đường kính d = ${d}cm. Chu vi vành nón là:`, parseFloat(c.toFixed(2)), 'float', 'cm', `Chu vi hình tròn = d x 3,14.\nC = ${d} x 3,14 = ${formatNum(parseFloat(c.toFixed(2)))} (cm).`));
            }
        } else { // Hình thang
            const a = getRandomInt(20, 50);
            const b = getRandomInt(10, 30);
            const h = getRandomInt(10, 25);
            const s = ((a + b) * h) / 2;
            const context = getRandomItem(["Một thửa ruộng bậc thang ở đồi chè Long Cốc", "Một mảnh vườn trồng bưởi ở Đoan Hùng"]);
            qs.push(createQuestion(`${context} hình thang có đáy lớn ${a}m, đáy bé ${b}m, chiều cao ${h}m. Diện tích là:`, s, 'float', 'm²', `Diện tích hình thang = (đáy lớn + đáy bé) x chiều cao : 2.\nS = (${a} + ${b}) x ${h} : 2 = ${formatNum(s)} (m²).`));
        }
    }
    return qs;
  },

  chuong5: () => { // Tỉ số %
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const subtype = getRandomInt(1, 3);
        if (subtype === 1) { // Tìm tỉ số %
            const a = getRandomInt(1, 10) * 5; 
            const b = 100; 
            const val = a; 
            qs.push(createQuestion(`Tỉ số phần trăm của số cây bưởi (${a} cây) và tổng số cây trong vườn (${b} cây) tại một trang trại ở Đoan Hùng là:`, val, 'int', '%', `Tỉ số phần trăm là: ${a} : ${b} = ${formatNum(a/b)} = ${val}%.`));
        } else if (subtype === 2) { // Tìm giá trị % của số
            const total = getRandomInt(10, 100) * 10;
            const percent = getRandomInt(1, 9) * 10; 
            const val = (total * percent) / 100;
            qs.push(createQuestion(`Tìm ${percent}% của ${total}kg:`, val, 'float', 'kg', `Muốn tìm ${percent}% của ${total}, ta lấy ${total} nhân với ${percent} rồi chia cho 100.\nKết quả: ${total} x ${percent} : 100 = ${formatNum(val)} (kg).`));
        } else { // Lời văn
            const price = getRandomInt(40, 80) * 1000; 
            const discount = getRandomInt(1, 3) * 10; 
            const money = (price * discount) / 100;
            const product = getRandomItem(PHUTHO_SPECIALTIES);
            qs.push(createQuestion(`Một hộp ${product} giá ${formatNum(price)} đồng. Nhân dịp lễ hội Đền Hùng, cửa hàng giảm giá ${discount}%. Số tiền được giảm là:`, money, 'int', 'đồng', `Số tiền được giảm là:\n${formatNum(price)} x ${discount} : 100 = ${formatNum(money)} (đồng).`));
        }
    }
    return qs;
  },

  chuong6: () => { // Chuyển động
    const qs: Question[] = [];
    for(let i=0; i<10; i++) {
        const k = getRandomInt(1, 3);
        const v = getRandomInt(30, 60); 
        const t = getRandomInt(2, 5); 
        const s = v * t;
        const route = getRandomItem(PHUTHO_ROUTES);
        
        if (k === 1) { // Tìm s
            qs.push(createQuestion(`Một ô tô đi từ ${route.from} đến ${route.to} với vận tốc ${v} km/h trong ${t} giờ. Quãng đường đi được là:`, s, 'int', 'km', `Quãng đường = Vận tốc x Thời gian.\ns = ${v} x ${t} = ${s} (km).`));
        } else if (k === 2) { // Tìm v
            qs.push(createQuestion(`Bác Hùng đi xe máy từ ${route.from} đến ${route.to} hết quãng đường ${s} km trong ${t} giờ. Vận tốc của xe là:`, v, 'int', 'km/h', `Vận tốc = Quãng đường : Thời gian.\nv = ${s} : ${t} = ${v} (km/h).`));
        } else { // Tìm t
            const dist = v * t;
            qs.push(createQuestion(`Một ca nô xuôi dòng sông Lô đoạn qua thành phố Việt Trì dài ${dist} km với vận tốc ${v} km/h hết bao lâu?`, t, 'int', 'giờ', `Thời gian = Quãng đường : Vận tốc.\nt = ${dist} : ${v} = ${t} (giờ).`));
        }
    }
    return qs;
  }
};

// --- DỮ LIỆU LÝ THUYẾT (TĨNH) ---

const CHAPTER_CONTENT: Record<string, ChapterData> = {
  chuong1: {
    id: 'chuong1',
    title: 'Ôn tập Phân số & Hỗn số',
    icon: '1️⃣',
    desc: 'Phân số thập phân, hỗn số, chuyển đổi và tính toán.',
    theory: [
      { type: 'header', content: '1. Phân số thập phân' },
      { type: 'text', content: 'Các phân số có mẫu số là 10, 100, 1000... được gọi là phân số thập phân.' },
      { type: 'example', content: 'Ví dụ: 3/10; 5/100; 17/1000 là các phân số thập phân.' },
      { type: 'header', content: '2. Hỗn số' },
      { type: 'box', content: 'Hỗn số gồm hai phần: Phần nguyên và Phần phân số.\nPhần phân số của hỗn số bao giờ cũng bé hơn 1.', title: 'Ghi nhớ' },
      { type: 'header', content: '3. Chuyển hỗn số thành phân số' },
      { type: 'text', content: 'Ta lấy phần nguyên nhân với mẫu số rồi cộng với tử số (để làm tử số mới), giữ nguyên mẫu số.' },
      { type: 'example', content: '2 1/3 = (2 x 3 + 1)/3 = 7/3' }
    ]
  },
  chuong2: {
    id: 'chuong2',
    title: 'Số thập phân & So sánh',
    icon: '2️⃣',
    desc: 'Khái niệm, hàng số, đọc viết và so sánh số thập phân.',
    theory: [
      { type: 'header', content: '1. Khái niệm số thập phân' },
      { type: 'text', content: 'Mỗi số thập phân gồm hai phần: phần nguyên và phần thập phân, ngăn cách bởi dấu phẩy.' },
      { type: 'example', content: '8,56: Phần nguyên là 8, phần thập phân là 56.' },
      { type: 'header', content: '2. So sánh hai số thập phân' },
      { type: 'box', content: 'Bước 1: So sánh phần nguyên trước.\nBước 2: Nếu phần nguyên bằng nhau, so sánh hàng phần mười, rồi đến hàng phần trăm...', title: 'Quy tắc' },
      { type: 'example', content: '3,5 > 2,9 (Vì 3 > 2)\n4,15 < 4,2 (Vì hàng phần mười 1 < 2)' }
    ]
  },
  chuong3: {
    id: 'chuong3',
    title: 'Các phép tính số thập phân',
    icon: '3️⃣',
    desc: 'Cộng, trừ, nhân, chia số thập phân.',
    theory: [
      { type: 'header', content: '1. Cộng, trừ' },
      { type: 'box', content: 'Đặt tính sao cho các dấu phẩy thẳng cột. Cộng/trừ như số tự nhiên. Viết dấu phẩy ở kết quả thẳng cột.', title: 'Lưu ý quan trọng' },
      { type: 'header', content: '2. Nhân số thập phân' },
      { type: 'text', content: 'Đếm xem cả hai thừa số có bao nhiêu chữ số ở phần thập phân rồi dùng dấu phẩy tách ở tích bấy nhiêu chữ số từ phải sang trái.' },
      { type: 'header', content: '3. Chia số thập phân' },
      { type: 'text', content: 'Khi chia số thập phân, nếu dời dấu phẩy ở số chia sang phải bao nhiêu chữ số thì cũng dời dấu phẩy ở số bị chia sang phải bấy nhiêu chữ số.' }
    ]
  },
  chuong4: {
    id: 'chuong4',
    title: 'Hình học phẳng',
    icon: '4️⃣',
    desc: 'Diện tích Tam giác, Hình thang, Hình tròn.',
    theory: [
      { type: 'header', content: '1. Hình tam giác' },
      { type: 'box', content: 'S = (a x h) : 2', title: 'Diện tích Tam giác' },
      { type: 'header', content: '2. Hình thang' },
      { type: 'box', content: 'S = (a + b) x h : 2', title: 'Diện tích Hình thang' },
      { type: 'header', content: '3. Hình tròn' },
      { type: 'box', content: 'Chu vi C = d x 3,14\nDiện tích S = r x r x 3,14', title: 'Công thức Hình tròn' }
    ]
  },
  chuong5: {
    id: 'chuong5',
    title: 'Tỉ số phần trăm',
    icon: '5️⃣',
    desc: 'Giải toán về tỉ số phần trăm.',
    theory: [
      { type: 'header', content: '1. Tìm tỉ số phần trăm' },
      { type: 'text', content: 'Tìm thương của hai số -> Nhân nhẩm với 100 và thêm ký hiệu %.' },
      { type: 'example', content: '3 : 4 = 0,75 = 75%' },
      { type: 'header', content: '2. Tìm giá trị % của một số' },
      { type: 'text', content: 'Muốn tìm a% của B: Lấy B nhân với a rồi chia cho 100.' },
      { type: 'example', content: '50% của 200kg = 200 x 50 : 100 = 100kg' }
    ]
  },
  chuong6: {
    id: 'chuong6',
    title: 'Toán chuyển động đều',
    icon: '6️⃣',
    desc: 'Vận tốc (v), Quãng đường (s), Thời gian (t).',
    theory: [
      { type: 'header', content: '1. Công thức' },
      { type: 'box', content: 'v = s : t\ns = v x t\nt = s : v', title: 'Bộ ba công thức' },
      { type: 'text', content: 'Lưu ý: Các đơn vị đo phải tương ứng (km/giờ, m/phút...).' },
      { type: 'example', content: 'Đi 120km trong 3 giờ -> Vận tốc v = 120 : 3 = 40 km/giờ.' }
    ]
  }
};

// --- COMPONENTS ---

const Navbar = ({ goHome }: { goHome: () => void }) => {
  return (
    <nav style={{
      background: 'linear-gradient(to right, #0284c7, #0ea5e9)',
      padding: '15px 20px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div 
        onClick={goHome} 
        style={{ color: 'white', fontWeight: 'bold', fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <span>🏫</span> Lớp Học Toán 5
      </div>
      <button 
        onClick={goHome}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid white',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Về Trang Chủ
      </button>
    </nav>
  );
};

const TheoryView = ({ chapter, onStartQuiz }: { chapter: ChapterData, onStartQuiz: () => void }) => (
  <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px' }}>
    <h1 style={{ textAlign: 'center', color: '#1e3a8a', fontSize: '2rem', marginBottom: '10px' }}>{chapter.title}</h1>
    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>{chapter.desc}</p>
    
    <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      {chapter.theory.map((item, index) => {
        switch (item.type) {
          case 'header':
            return <h2 key={index} style={{ color: '#0369a1', marginTop: '25px', borderLeft: '5px solid #0ea5e9', paddingLeft: '15px' }}>{item.content}</h2>;
          case 'box':
            return (
              <div key={index} style={{ background: '#ecfccb', border: '2px solid #84cc16', borderRadius: '10px', padding: '15px', margin: '20px 0' }}>
                <strong style={{ color: '#4d7c0f', display: 'block', marginBottom: '5px' }}>📌 {item.title || 'Ghi nhớ'}</strong>
                <div style={{ whiteSpace: 'pre-line' }}>{item.content}</div>
              </div>
            );
          case 'example':
            return (
              <div key={index} style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '15px', margin: '15px 0', fontStyle: 'italic', color: '#1e40af' }}>
                <strong>Ví dụ:</strong> <span style={{ whiteSpace: 'pre-line' }}>{item.content}</span>
              </div>
            );
          default:
            return <p key={index} style={{ lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '15px', color: '#334155' }}>{item.content}</p>;
        }
      })}
    </div>

    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <button 
        onClick={onStartQuiz}
        style={{
          background: 'linear-gradient(to right, #f59e0b, #ea580c)',
          color: 'white',
          border: 'none',
          padding: '15px 50px',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(234, 88, 12, 0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Bắt đầu ôn tập ngay 🚀
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

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px', borderLeft: '10px solid #0ea5e9' }}>
        <h2 style={{ margin: 0, color: '#4b5563' }}>📝 Bài tập tự luyện: {title}</h2>
        <p style={{ margin: '10px 0 0', color: '#6b7280' }}>Đề bài được sinh ngẫu nhiên. Hãy làm thật kỹ nhé!</p>
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
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            border: submitted ? (isCorrect ? '1px solid #22c55e' : '1px solid #ef4444') : '1px solid #e5e7eb',
          }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', marginRight: '8px', fontSize: '0.9em' }}>Câu {index + 1}</span>
              {q.question}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
              {q.options.map((opt, optIdx) => (
                <label 
                  key={optIdx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: submitted ? 'default' : 'pointer',
                    background: userAnswers[q.id] === optIdx ? '#e0f2fe' : 'transparent',
                    fontWeight: userAnswers[q.id] === optIdx ? 'bold' : 'normal'
                  }}
                >
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    checked={userAnswers[q.id] === optIdx} 
                    onChange={() => handleSelect(q.id, optIdx)}
                    disabled={submitted}
                    style={{ width: '20px', height: '20px', marginRight: '10px' }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {submitted && userAnswers[q.id] !== q.correct && q.explanation && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', color: '#9a3412', display: 'flex', gap: '10px', alignItems: 'start' }}>
                <span style={{ fontSize: '1.5em' }}>💡</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>Hướng dẫn giải:</strong>
                  <span style={{ whiteSpace: 'pre-line' }}>{q.explanation}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '50px' }}>
        {!submitted ? (
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(userAnswers).length < 10}
            style={{
              background: Object.keys(userAnswers).length < 10 ? '#cbd5e1' : '#0ea5e9',
              color: 'white',
              border: 'none',
              padding: '15px 50px',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              borderRadius: '50px',
              cursor: Object.keys(userAnswers).length < 10 ? 'not-allowed' : 'pointer',
            }}
          >
            {Object.keys(userAnswers).length < 10 ? `Đã làm ${Object.keys(userAnswers).length}/10 câu` : 'Nộp bài'}
          </button>
        ) : (
          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '2.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Kết quả: {calculateScore()}/10</h2>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                onClick={onRetry} 
                style={{ 
                  padding: '12px 30px', 
                  borderRadius: '50px', 
                  border: 'none', 
                  background: '#0ea5e9', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  fontSize: '1.1rem'
                }}
              >
                🔄 Làm lại / Chọn chương khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChapterCard: React.FC<{ chapter: ChapterData, onClick: () => void }> = ({ chapter, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: 'white', 
      borderRadius: '20px', 
      padding: '25px', 
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
      e.currentTarget.style.borderColor = '#0ea5e9';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
      e.currentTarget.style.borderColor = 'transparent';
    }}
  >
    <div style={{ fontSize: '4rem', marginBottom: '15px' }}>{chapter.icon}</div>
    <h3 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '1.2rem' }}>{chapter.title}</h3>
    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{chapter.desc}</p>
  </div>
);

// --- MAIN APP ---

const App = () => {
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'theory' | 'quiz'>('theory');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  const handleStartQuiz = (chapterId: string) => {
    // Gọi hàm sinh đề ngẫu nhiên từ Generators
    if (Generators[chapterId as keyof typeof Generators]) {
      const newQuestions = Generators[chapterId as keyof typeof Generators]();
      setQuizQuestions(newQuestions);
      setViewMode('quiz');
      window.scrollTo(0, 0);
    }
  };

  const activeChapterData = currentChapterId ? CHAPTER_CONTENT[currentChapterId] : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f9ff' }}>
      <Navbar goHome={() => { setCurrentChapterId(null); setViewMode('theory'); }} />
      
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {!activeChapterData ? (
          // HOME PAGE GRID
          <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h1 style={{ color: '#0f172a', fontSize: '2.5rem', marginBottom: '15px' }}>Hệ thống ôn tập Toán Lớp 5</h1>
              <p style={{ color: '#64748b', fontSize: '1.2rem' }}>Bám sát chương trình sách giáo khoa "Kết nối tri thức"</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
              {Object.values(CHAPTER_CONTENT).map((chapter) => (
                <ChapterCard key={chapter.id} chapter={chapter} onClick={() => setCurrentChapterId(chapter.id)} />
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
        <p style={{ fontWeight: 'bold', color: 'white' }}>© 2024 Lớp Học Toán 5</p>
        <p style={{ fontSize: '0.9rem' }}>Nội dung được biên soạn dựa trên bộ sách Kết nối tri thức với cuộc sống.</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);

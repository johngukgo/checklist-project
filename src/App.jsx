import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Home, FileCheck, Download, Wind, Refrigerator, Shirt, Flame, Microwave, Bed, BookOpen, SquareStack, Shield, AlertCircle, Calculator } from 'lucide-react';

const RentalChecklist = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [safetyTerms, setSafetyTerms] = useState({
    registration: null,
    rightsFreeze: null,
    ownerAccount: null
  });
  const [costData, setCostData] = useState({
    deposit: '',
    monthlyRent: '',
    propertyType: '', // 주택 or 오피스텔
    showBrokerageFee: false,
    roomSize: '', // 원룸, 투룸, 쓰리룸 이상
    showMovingCost: false,
    showCleaningCost: false,
    jeonseeLoan: false,
    loanAmount: '',
    depositInsurance: false,
    contractPeriod: ''
  });

  // 중개수수료 계산 함수
  const calculateBrokerageFee = () => {
    if (!costData.deposit) return null;
    
    // 만원 단위를 원으로 변환
    const deposit = parseFloat(costData.deposit.replace(/,/g, '')) * 10000;
    const monthlyRent = costData.monthlyRent ? parseFloat(costData.monthlyRent.replace(/,/g, '')) * 10000 : 0;
    const baseAmount = deposit + (monthlyRent * 100);
    
    // 주택 임대차 요율 구간 (2025년 기준)
    const housingRates = [
      { min: 0, max: 50000000, rate: 0.005, limit: 200000 },
      { min: 50000000, max: 100000000, rate: 0.004, limit: 300000 },
      { min: 100000000, max: 600000000, rate: 0.003, limit: null },
      { min: 600000000, max: 1200000000, rate: 0.004, limit: null },
      { min: 1200000000, max: 1500000000, rate: 0.005, limit: null },
      { min: 1500000000, max: Infinity, rate: 0.006, limit: null }
    ];
    
    // 주택 중개수수료 계산
    let housingFee = 0;
    for (const bracket of housingRates) {
      if (baseAmount >= bracket.min && baseAmount < bracket.max) {
        housingFee = Math.floor(baseAmount * bracket.rate);
        if (bracket.limit && housingFee > bracket.limit) {
          housingFee = bracket.limit;
        }
        break;
      }
    }
    
    // 오피스텔 요율
    // 주거용(85㎡ 이하, 주방/화장실/목욕/하수 시설): 0.4%
    const officetelResidentialFee = Math.floor(baseAmount * 0.004);
    
    return { 
      housingFee, 
      officetelResidentialFee
    };
  };

  // 이사비용 범위
  const getMovingCost = (size) => {
    const costs = {
      '원룸': { min: 400000, max: 600000 },
      '투룸': { min: 800000, max: 1000000 },
      '쓰리룸 이상': { min: 1700000, max: 2500000 }
    };
    return costs[size] || null;
  };

  // 입주청소비용 범위
  const getCleaningCost = (size) => {
    const costs = {
      '원룸': { min: 150000, max: 250000 },
      '투룸': { min: 250000, max: 300000 },
      '쓰리룸 이상': { min: 300000, max: 450000 }
    };
    return costs[size] || null;
  };

  // 전세대출 월 이자 계산
  const calculateMonthlyInterest = () => {
    if (!costData.loanAmount) return 0;
    const loan = parseFloat(costData.loanAmount.replace(/,/g, '')) * 10000; // 만원을 원으로 변환
    const annualRate = 0.04; // 4%
    return Math.floor(loan * annualRate / 12);
  };

  // 보증보험료 계산
  const calculateInsuranceFee = () => {
    if (!costData.deposit || !costData.contractPeriod) return 0;
    const deposit = parseFloat(costData.deposit.replace(/,/g, '')) * 10000; // 만원을 원으로 변환
    const period = parseFloat(costData.contractPeriod);
    return Math.floor(deposit * 0.00154 * period);
  };

  // 숫자 포맷팅
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 만원 단위를 읽기 쉬운 텍스트로 변환
  const formatWonText = (manwon) => {
    if (!manwon) return '';
    const num = parseFloat(manwon.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '';

    const eok = Math.floor(num / 10000); // 억
    const remainder = num % 10000;
    const cheonman = Math.floor(remainder / 1000); // 천만
    const baekman = Math.floor((remainder % 1000) / 100); // 백만
    const man = remainder % 100; // 만

    let result = '';
    
    if (eok > 0) {
      result += `${eok}억`;
      if (cheonman > 0) result += ` ${cheonman}천`;
      if (baekman > 0 && cheonman === 0) result += ` ${baekman}백`;
      result += '원';
    } else if (cheonman > 0) {
      result += `${cheonman}천`;
      if (baekman > 0) result += `${baekman}백`;
      result += '만원';
    } else if (baekman > 0) {
      result += `${baekman}백만원`;
    } else {
      result += `${man}만원`;
    }

    return result;
  };

  const questions = [
    // 계약 조건 섹션
    {
      id: 'location',
      question: '희망 지역을 입력해주세요',
      description: '시/구/동, 동네 이름, 또는 지하철 노선(예: 7호선 라인)까지 자유롭게 작성해주세요.',
      type: 'text',
      placeholder: '예: 서울시 강남구, 7호선 라인, 판교역 근처',
      section: '계약조건'
    },
    {
      id: 'contractType',
      question: '계약 유형과 예산을 입력해주세요',
      description: '전세는 보증금만, 월세는 보증금+월세를 내는 계약이에요. 전세와 월세 모두 고려 중이라면 둘 다 선택할 수 있어요.',
      type: 'contractMultiple',
      options: ['전세', '월세'],
      section: '계약조건'
    },
    {
      id: 'moveInDate',
      question: '희망 입주 시기는 언제인가요?',
      description: '조건에 맞는 집을 찾아도 입주시기가 맞지 않으면 헛수고가 될 수 있어요. 구체적인 시기를 입력하거나 협의 가능 여부를 선택해주세요.',
      type: 'moveInDate',
      placeholder: '예: 2025년 6월, 7월 중순, 2025년 여름',
      section: '계약조건'
    },
    {
      id: 'contractPeriod',
      question: '계약 기간은 어떻게 하시겠어요?',
      description: '법적으로 2년이 기본이지만, 협의를 통해 조정할 수 있어요.',
      type: 'radio',
      options: ['2년 (기본)', '1년', '1년 미만의 단기임대'],
      section: '계약조건'
    },
    {
      id: 'propertyType',
      question: '주거 형태를 선택해주세요',
      description: '원하시는 건물 유형을 선택해주세요.',
      type: 'propertyTypeMultiple',
      options: ['아파트', '빌라/연립', '오피스텔', '단독/다가구', '상관없음'],
      section: '계약조건'
    },
    {
      id: 'managementFee',
      question: '희망 관리비는 얼마정도인가요?',
      description: '건물 관리를 위해 거주하는 동안 관리비가 부과돼요. 주택 유형에 따라 관리비가 다를 수 있으니, 집을 보기 전 사전에 어느 정도 예상하는 것이 좋아요.',
      type: 'radioWithDescription',
      options: [
        { value: '5만원 미만', description: '평균적인 단독·다가구주택 관리비' },
        { value: '5만원 ~ 10만원 미만', description: '평균적인 원룸·빌라 관리비' },
        { value: '10만원 ~ 20만원 미만', description: '평균적인 오피스텔·소형 아파트 관리비' },
        { value: '20만원 이상', description: '평균적인 아파트 관리비' }
      ],
      section: '계약조건'
    },
    {
      id: 'roomsAndBathrooms',
      question: '방과 화장실 개수를 선택해주세요',
      description: '거실을 제외한 방 개수와 화장실 개수예요.',
      type: 'roomsAndBathrooms',
      roomOptions: ['원룸', '1개', '2개', '3개 이상'],
      bathroomOptions: ['1개', '2개', '3개 이상'],
      section: '계약조건'
    },
    {
      id: 'floor',
      question: '층수 관련 조건이 있나요?',
      description: '원하시는 층수 조건을 선택해주세요. 건물 이미지를 클릭하여 선택할 수 있어요.',
      type: 'floorVisualClickable',
      options: ['저층 선호', '중층 선호', '고층 선호', '엘리베이터 필수', '무관'],
      section: '계약조건'
    },
    {
      id: 'parking',
      question: '주차 공간이 필요하신가요?',
      description: '본인 또는 가족의 차량 주차 여부예요.',
      type: 'radio',
      options: ['필수', '있으면 좋음', '불필요'],
      section: '계약조건'
    },
    {
      id: 'parkingCount',
      question: '주차 대수는 몇 대인가요?',
      description: '필요한 주차 공간의 수를 선택해주세요. 주차 공간만큼 관리비에 추가 비용이 나올 수 있어요.',
      type: 'radio',
      options: ['1대', '2대 이상'],
      condition: (ans) => ans.parking === '필수' || ans.parking === '있으면 좋음',
      section: '계약조건'
    },
    {
      id: 'options',
      question: '필수 옵션을 모두 선택해주세요',
      description: '계약 시 꼭 갖춰져 있어야 하는 항목을 선택해주세요.',
      type: 'optionsWithIcons',
      options: [
        { name: '에어컨', icon: Wind },
        { name: '냉장고', icon: Refrigerator },
        { name: '세탁기', icon: Shirt },
        { name: '가스레인지/인덕션', icon: Flame },
        { name: '전자레인지', icon: Microwave },
        { name: '침대', icon: Bed },
        { name: '책상', icon: BookOpen },
        { name: '옷장', icon: SquareStack },
        { name: '옵션 없어도 됨', icon: null }
      ],
      section: '계약조건'
    },
    // 선택 조건 섹션
    {
      id: 'pets',
      question: '반려동물을 키우시나요?',
      description: '반려동물 동반 입주 가능 여부를 특약으로 명시해야 할 수도 있어요.',
      type: 'petsWithDetails',
      options: ['예', '아니오'],
      section: '선택조건'
    },
    {
      id: 'jeonseeLoan',
      question: '전세대출을 받을 예정인가요?',
      description: '전세대출이 필요한 경우, 임대인의 협조가 필요할 수 있으며, 전세대출 없이 입주가 불가능한 상황이라면 전세대출이 부결되었을 때 임대인에게 지급한 금액을 돌려받을 수 있도록 특약에 기재하는 것이 좋아요.',
      type: 'radio',
      options: ['예', '아니오'],
      section: '선택조건'
    },
    {
      id: 'depositInsurance',
      question: '보증보험에 가입할 예정인가요?',
      description: '보증보험 가입 시 임대인의 협조가 필요해요.',
      type: 'radio',
      options: ['예', '아니오'],
      section: '선택조건'
    },
    {
      id: 'additionalTerms',
      question: '추가로 특약에 넣고 싶은 내용이 있나요?',
      description: '위에서 다루지 않은 특별한 조건이 있다면 자유롭게 작성해주세요.',
      type: 'textWithNone',
      placeholder: '예: 공과금 분담, 주변 소음 관련 사항 등',
      section: '선택조건'
    }
  ];

  const handleGoHome = () => {
    if (step > 0 || Object.keys(answers).length > 0 || showCostCalculator) {
      if (window.confirm('홈으로 가면 지금까지 진행한 내용이 초기화 됩니다.')) {
        setShowLanding(true);
        setShowCostCalculator(false);
        setStep(0);
        setAnswers({});
        setShowResult(false);
        setSafetyTerms({
          registration: null,
          rightsFreeze: null,
          ownerAccount: null
        });
        setCostData({
          deposit: '',
          monthlyRent: '',
          propertyType: '',
          showBrokerageFee: false,
          roomSize: '',
          showMovingCost: false,
          showCleaningCost: false,
          jeonseeLoan: false,
          loanAmount: '',
          depositInsurance: false,
          contractPeriod: ''
        });
      }
    } else {
      setShowLanding(true);
    }
  };

  const getVisibleQuestions = () => {
    return questions.filter(q => !q.condition || q.condition(answers));
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[step];
  const progress = ((step + 1) / visibleQuestions.length) * 100;

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (step < visibleQuestions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setShowLanding(true);
    setStep(0);
    setAnswers({});
    setShowResult(false);
    setSafetyTerms({
      registration: null,
      rightsFreeze: null,
      ownerAccount: null
    });
  };

  // 모바일 감지
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 이미지로 저장 (모바일용 - 2장)
  const saveAsImages = async () => {
    try {
      // 동적으로 스크립트 로드
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      // html2canvas 로드
      if (typeof window.html2canvas === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      }

      // 1장: 계약 조건 테이블 영역
      const tablesElement = document.querySelector('.checklist-tables');
      if (tablesElement) {
        const canvas1 = await window.html2canvas(tablesElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // 첫 번째 이미지 다운로드
        const link1 = document.createElement('a');
        link1.download = '임대차계약_체크리스트_1.png';
        link1.href = canvas1.toDataURL('image/png');
        link1.click();
        
        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 2장: 특약 사항 영역
      const termsElement = document.querySelector('.special-terms-section');
      if (termsElement) {
        const canvas2 = await window.html2canvas(termsElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // 두 번째 이미지 다운로드
        const link2 = document.createElement('a');
        link2.download = '임대차계약_특약사항_2.png';
        link2.href = canvas2.toDataURL('image/png');
        link2.click();
      }
      
    } catch (error) {
      console.error('이미지 저장 중 오류:', error);
      alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // PDF 생성 함수 (PC용)
  const generatePDF = async () => {
    try {
      // 동적으로 스크립트 로드
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      // html2canvas와 jsPDF 로드 (아직 로드되지 않았다면)
      if (typeof window.html2canvas === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      }
      if (typeof window.jspdf === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }

      const element = document.querySelector('.pdf-content');
      if (!element) return;

      // 캔버스로 변환
      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 height in mm
      let heightLeft = imgHeight;
      let position = 0;

      // 첫 페이지
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 추가 페이지
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // PDF 저장
      pdf.save('임대차계약_체크리스트.pdf');
    } catch (error) {
      console.error('PDF 생성 중 오류:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 저장 핸들러
  const handleSave = () => {
    if (isMobile()) {
      saveAsImages();
    } else {
      window.print();
    }
  };

  const generateSpecialTerms = () => {
    const terms = [];

    if (answers.pets?.hasPets === '예' && answers.pets?.needsClause === 'yes') {
      let petClause = '임차인은 반려동물을 동반하여 입주하며, 임대인은 이를 승낙함';
      if (answers.pets?.includeRepair) {
        petClause += '. 단, 임차인은 반려동물에 의한 도배/장판 훼손 시 이를 교체하기로 함';
      }
      terms.push({
        title: '반려동물 동반 입주',
        content: petClause
      });
    }

    if (answers.jeonseeLoan === '예') {
      terms.push({
        title: '전세대출 협조',
        content: '임대인은 임차인의 전세대출에 협조하며, 물건지 사유로 대출이 불가능할 경우 기지급한 금원을 즉시 반환한다'
      });
    }

    if (answers.depositInsurance === '예') {
      terms.push({
        title: '보증보험 가입 협조',
        content: '임대인은 임차인의 보증보험 가입에 협조하며, 보증보험 가입이 불가능할 경우 기지급한 금원을 즉시 반환한다'
      });
    }

    if (answers.additionalTerms && answers.additionalTerms !== 'none' && answers.additionalTerms.trim()) {
      terms.push({
        title: '기타 특약',
        content: answers.additionalTerms
      });
    }

    // 안전 특약 추가
    if (safetyTerms.registration === 'select') {
      terms.push({
        title: '전입신고 및 확정일자 취득',
        content: '임대인은 임차인이 전입신고 및 확정일자를 취득하는 데 필요한 서류를 즉시 제공하며, 이에 협조할 의무가 있음'
      });
    }

    if (safetyTerms.rightsFreeze === 'select') {
      terms.push({
        title: '권리변동 금지',
        content: '임대인은 임차인의 대항력 및 우선변제권이 발생하기 전까지 해당 부동산에 대한 소유권 이전, 근저당권 설정 등 일체의 권리변동 행위를 하지 않기로 함'
      });
    }

    if (safetyTerms.ownerAccount === 'select') {
      terms.push({
        title: '임대인 명의 계좌 송금',
        content: '임차인은 보증금을 등기부등본 상 소유자인 임대인 본인 명의의 계좌로만 송금하며, 제3자 명의 계좌로의 송금은 일체 인정되지 않음'
      });
    }

    return terms;
  };

  // 비용 계산기 화면
  if (showCostCalculator) {
    const brokerageFee = calculateBrokerageFee();
    const movingCost = getMovingCost(costData.roomSize);
    const cleaningCost = getCleaningCost(costData.roomSize);
    const monthlyInterest = calculateMonthlyInterest();
    const insuranceFee = calculateInsuranceFee();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-3xl mx-auto">
          {/* 홈 버튼 */}
          <button
            onClick={handleGoHome}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition text-gray-700 hover:text-indigo-600 font-medium"
          >
            <Home className="w-5 h-5" />
            홈
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-7 h-7 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">임대차계약 비용 계산기</h1>
            </div>

            {/* 계약 및 입주초기비용 섹션 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-600">
                💰 계약 및 입주초기비용
              </h2>

              {/* 보증금 입력 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  보증금 (만원)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="예: 10,000 (1억원)"
                    value={costData.deposit}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = value ? formatNumber(value) : '';
                      setCostData({ ...costData, deposit: formatted, showBrokerageFee: false });
                    }}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                  />
                  {costData.deposit && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      {formatWonText(costData.deposit)}
                    </div>
                  )}
                </div>
              </div>

              {/* 월세 입력 (선택) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월세 (만원) - 선택사항
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="예: 50 (50만원)"
                    value={costData.monthlyRent}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = value ? formatNumber(value) : '';
                      setCostData({ ...costData, monthlyRent: formatted, showBrokerageFee: false });
                    }}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                  />
                  {costData.monthlyRent && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      {formatWonText(costData.monthlyRent)}
                    </div>
                  )}
                </div>
              </div>

              {/* 중개수수료 계산 버튼 */}
              {costData.deposit && !costData.showBrokerageFee && (
                <button
                  onClick={() => setCostData({ ...costData, showBrokerageFee: true })}
                  className="w-full mb-4 p-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  중개수수료 계산하기
                </button>
              )}

              {/* 중개수수료 결과 */}
              {costData.showBrokerageFee && brokerageFee && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-300">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">중개수수료 (상한요율 기준)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">주택:</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {formatNumber(brokerageFee.housingFee)}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">오피스텔 (주거용*):</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {formatNumber(brokerageFee.officetelResidentialFee)}원
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      * 주거용: 전용면적 85㎡ 이하 + 주방·화장실·목욕·하수 시설 구비
                    </p>
                    <p className="text-xs text-gray-600">
                      * 실제 중개수수료는 협의를 통해 조정될 수 있습니다
                    </p>
                  </div>
                </div>
              )}

              {/* 집의 규모 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  집의 규모
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['원룸', '투룸', '쓰리룸 이상'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setCostData({ 
                        ...costData, 
                        roomSize: size,
                        showMovingCost: true,
                        showCleaningCost: true
                      })}
                      className={`p-3 rounded-lg border-2 transition font-medium ${
                        costData.roomSize === size
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* 이사비용 */}
              {costData.showMovingCost && movingCost && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-300">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">📦 예상 이사비용</h3>
                  <p className="text-lg font-bold text-blue-600">
                    {formatNumber(movingCost.min)}원 ~ {formatNumber(movingCost.max)}원
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    * 포장이사 기준가격입니다
                  </p>
                  <p className="text-xs text-gray-600">
                    * 층수, 엘리베이터 유무, 거리에 따라 달라질 수 있습니다
                  </p>
                </div>
              )}

              {/* 입주청소비용 */}
              {costData.showCleaningCost && cleaningCost && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-300">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">🧹 예상 입주청소비용</h3>
                  <p className="text-lg font-bold text-green-600">
                    {formatNumber(cleaningCost.min)}원 ~ {formatNumber(cleaningCost.max)}원
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    * 전문업체 기준 평균 비용이며, 평수와 오염도에 따라 달라질 수 있습니다
                  </p>
                </div>
              )}
            </div>

            {/* 금융비용 섹션 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-amber-600">
                🏦 금융비용 (선택사항)
              </h2>

              {/* 전세대출 */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={costData.jeonseeLoan}
                    onChange={(e) => setCostData({ 
                      ...costData, 
                      jeonseeLoan: e.target.checked,
                      loanAmount: e.target.checked ? costData.loanAmount : ''
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">전세대출</span>
                </label>

                {costData.jeonseeLoan && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대출 금액 (만원)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="예: 5,000 (5천만원)"
                          value={costData.loanAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            const formatted = value ? formatNumber(value) : '';
                            setCostData({ ...costData, loanAmount: formatted });
                          }}
                          className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                        />
                        {costData.loanAmount && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                            {formatWonText(costData.loanAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                    {costData.loanAmount && monthlyInterest > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-300">
                        <p className="text-sm text-gray-700">
                          월 예상 대출이자 (4% 금리 기준): 
                          <span className="ml-2 text-lg font-bold text-amber-600">
                            {formatNumber(monthlyInterest)}원
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 보증보험 */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={costData.depositInsurance}
                    onChange={(e) => setCostData({ 
                      ...costData, 
                      depositInsurance: e.target.checked,
                      contractPeriod: e.target.checked ? costData.contractPeriod : ''
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">보증보험 가입</span>
                </label>

                {costData.depositInsurance && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        임대차 계약기간 (년)
                      </label>
                      <input
                        type="text"
                        placeholder="예: 2"
                        value={costData.contractPeriod}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setCostData({ ...costData, contractPeriod: value });
                        }}
                        className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    {costData.contractPeriod && insuranceFee > 0 && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-300">
                        <p className="text-sm text-gray-700 mb-1">
                          보증보험료 (보증금 × 0.154% × 계약기간):
                        </p>
                        <p className="text-lg font-bold text-purple-600">
                          {formatNumber(insuranceFee)}원
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 총 비용 요약 */}
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-300">
              <h2 className="text-xl font-bold text-gray-800 mb-4">💡 예상 비용 요약</h2>
              
              {/* 보증금/월세 영역 - 강조 박스 */}
              {(costData.deposit || costData.monthlyRent) && (
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-indigo-400 shadow-sm">
                  <div className="space-y-2">
                    {costData.deposit && (
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-800">보증금:</span>
                        <span className="text-lg font-bold text-indigo-600">
                          {formatNumber(parseFloat(costData.deposit.replace(/,/g, '')) * 10000)}원
                        </span>
                      </div>
                    )}
                    {costData.monthlyRent && (
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-800">월세:</span>
                        <span className="text-lg font-bold text-indigo-600">
                          {formatNumber(parseFloat(costData.monthlyRent.replace(/,/g, '')) * 10000)}원
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 구분선 */}
              {(costData.deposit || costData.monthlyRent) && (brokerageFee || movingCost || cleaningCost || monthlyInterest > 0 || insuranceFee > 0) && (
                <div className="border-t-2 border-gray-300 my-4"></div>
              )}

              {/* 나머지 비용들 */}
              <div className="space-y-2">
                {brokerageFee && costData.showBrokerageFee && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">중개수수료:</span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(Math.min(brokerageFee.housingFee, brokerageFee.officetelResidentialFee))}원 
                      ~ {formatNumber(Math.max(brokerageFee.housingFee, brokerageFee.officetelResidentialFee))}원
                    </span>
                  </div>
                )}
                {movingCost && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">이사비용:</span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(movingCost.min)}원 ~ {formatNumber(movingCost.max)}원
                    </span>
                  </div>
                )}
                {cleaningCost && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">입주청소비용:</span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(cleaningCost.min)}원 ~ {formatNumber(cleaningCost.max)}원
                    </span>
                  </div>
                )}
                {monthlyInterest > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">월 대출이자:</span>
                    <span className="font-semibold text-gray-800">{formatNumber(monthlyInterest)}원</span>
                  </div>
                )}
                {insuranceFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">보증보험료:</span>
                    <span className="font-semibold text-gray-800">{formatNumber(insuranceFee)}원</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 랜딩 페이지
  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            {/* 로고 영역 */}
            <div className="inline-flex items-center justify-center">
              <img 
                src="https://i.imgur.com/XgPDSCM.png" 
                alt="부동산가기전에 로고"
                className="h-32 object-contain"
              />
            </div>
          </div>
          
          {/* 하단 기능 버튼들 - 항상 수평 배치 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 임대차계약 체크리스트 만들기 */}
            <button
              onClick={() => setShowLanding(false)}
              className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <img 
                    src="https://i.imgur.com/5ob0aSD.png" 
                    alt="체크리스트 아이콘"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* 데스크톱 */}
                <h2 className="hidden md:block text-2xl font-bold text-gray-800">
                  임대차계약 체크리스트와<br />맞춤특약 만들기
                </h2>
                {/* 모바일 */}
                <h2 className="block md:hidden text-lg font-bold text-gray-800 leading-relaxed">
                  임대차계약<br />
                  체크리스트와<br />
                  맞춤특약<br />
                  만들기
                </h2>
              </div>
            </button>
            
            {/* 임대차계약 비용 계산기 */}
            <button
              onClick={() => {
                setShowLanding(false);
                setShowCostCalculator(true);
              }}
              className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <img 
                    src="https://i.imgur.com/g56IkAV.png" 
                    alt="비용 계산기 아이콘"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* 데스크톱 */}
                <h2 className="hidden md:block text-2xl font-bold text-gray-800">
                  임대차계약<br />비용 계산하기
                </h2>
                {/* 모바일 */}
                <h2 className="block md:hidden text-lg font-bold text-gray-800 leading-relaxed">
                  임대차계약<br />
                  비용<br />
                  계산하기
                </h2>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const specialTerms = generateSpecialTerms();
    const tableData = [];
    
    visibleQuestions.forEach((q) => {
      const answer = answers[q.id];
      if (!answer) return;
      if (q.id === 'additionalTerms') return;

      let label = q.question.replace(/을 입력해주세요|를 선택해주세요|을 선택해주세요|가 있나요\?|인가요\?|이 필요하신가요\?|을 키우시나요\?|을 받을 예정인가요\?|에 가입할 예정인가요\?/g, '');
      let displayValue = '';

      if (q.type === 'contractMultiple') {
        const types = answer.types || [];
        let typeStr = types.join(', ');
        let details = [];
        if (types.includes('전세') && answer.jeonse) {
          details.push(`전세 보증금: ${answer.jeonse}`);
        }
        if (types.includes('월세') && answer.wolseDeposit) {
          details.push(`월세 보증금: ${answer.wolseDeposit}, 월세: ${answer.wolseRent || '-'}`);
        }
        displayValue = details.length > 0 ? `${typeStr} (${details.join(' / ')})` : typeStr;
      } else if (q.type === 'moveInDate') {
        if (answer.type === 'negotiable') {
          displayValue = answer.value === 'immediate' ? '즉시입주 가능' : '입주계획 미정';
        } else {
          displayValue = answer.value || '-';
        }
      } else if (q.type === 'roomsAndBathrooms') {
        displayValue = `방 ${answer.rooms || '-'} / 화장실 ${answer.bathrooms || '-'}`;
      } else if (q.type === 'propertyTypeMultiple') {
        displayValue = Array.isArray(answer) ? answer.join(', ') : answer;
      } else if (q.type === 'floorVisualClickable') {
        displayValue = Array.isArray(answer) ? answer.join(', ') : answer;
      } else if (q.type === 'petsWithDetails') {
        displayValue = answer.hasPets === '예' ? 
          (answer.needsClause === 'yes' ? '예 (특약 포함)' : '예 (특약 미포함)') 
          : '아니오';
      } else if (q.type === 'optionsWithIcons') {
        const selectedOptions = answer.selected || [];
        const otherText = answer.other || '';
        let optionText = selectedOptions.join(', ');
        if (otherText) {
          optionText += optionText ? `, 기타: ${otherText}` : `기타: ${otherText}`;
        }
        displayValue = optionText || '-';
      } else if (Array.isArray(answer)) {
        displayValue = answer.join(', ');
      } else {
        displayValue = answer;
      }

      tableData.push({ label, value: displayValue, section: q.section });
    });

    const contractConditions = tableData.filter(item => item.section === '계약조건');
    const selectionConditions = tableData.filter(item => item.section === '선택조건');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 print:shadow-none pdf-content">
          {/* 홈 버튼 (인쇄 시 숨김) */}
          <button
            onClick={() => {
              setShowLanding(true);
              setStep(0);
              setAnswers({});
              setShowResult(false);
              setSafetyTerms({
                registration: null,
                rightsFreeze: null,
                ownerAccount: null
              });
            }}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition text-indigo-700 font-medium print:hidden"
          >
            <Home className="w-5 h-5" />
            홈
          </button>

          <div className="flex items-center gap-3 mb-4 print:mb-3">
            <FileCheck className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">내 임대차 계약 체크리스트</h1>
          </div>
          
          <div className="mb-6 p-3 bg-indigo-50 rounded-lg print:bg-white print:border print:border-gray-300">
            <p className="text-xs text-indigo-800">
              이 체크리스트를 공인중개사무소에 가져가거나, 실제 계약 시 하나씩 확인해주세요.
            </p>
          </div>

          {/* 계약 조건과 선택 조건을 가로로 배치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:grid-cols-2 print:gap-3 checklist-tables">
            {/* 계약 조건 */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-indigo-600">
                📋 계약 조건
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">항목</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractConditions.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-2/5">{row.label}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-indigo-600 font-medium break-words">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 선택 조건 */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-green-600">
                ✨ 선택 조건
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">항목</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectionConditions.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-2/5">{row.label}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-green-600 font-medium break-words">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 안전 특약 선택 섹션 */}
          <div className="mb-6 p-5 bg-amber-50 rounded-lg border-2 border-amber-300 print:hidden">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg font-bold text-amber-900">
                임대차를 더욱 안전하게 만드는 특약
              </h2>
            </div>

            <div className="space-y-4">
              {/* 전입신고 및 확정일자 */}
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">전입신고 및 확정일자 취득 특약</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      <strong className="text-amber-700">전입신고</strong>는 해당 주소지로 주민등록을 이전하는 것이고, 
                      <strong className="text-amber-700"> 확정일자</strong>는 계약서에 공식 날짜 도장을 받는 거예요. 
                      이 두 가지를 완료해야 <strong>대항력(제3자에게 내 권리를 주장할 수 있는 힘)</strong>이 생겨서, 
                      집주인이 집을 팔거나 담보로 잡아도 임차인의 보증금을 보호받을 수 있어요.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-6">
                  <button
                    onClick={() => setSafetyTerms({...safetyTerms, registration: 'select'})}
                    className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition text-xs font-medium ${
                      safetyTerms.registration === 'select'
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-gray-300 hover:border-amber-400'
                    }`}
                  >
                    해당 특약 선택
                  </button>
                  <button
                    onClick={() => setSafetyTerms({...safetyTerms, registration: 'skip'})}
                    className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition text-xs font-medium ${
                      safetyTerms.registration === 'skip'
                        ? 'border-gray-400 bg-gray-100 text-gray-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    필요없음
                  </button>
                </div>
              </div>

              {/* 권리변동 금지 */}
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">대항력 발생 전 권리변동 금지 특약</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      계약 후 <strong className="text-amber-700">전입신고와 확정일자를 받기 전</strong>에 집주인이 집을 팔거나 
                      대출을 받아 근저당을 설정하면, 나중에 보증금을 돌려받지 못할 위험이 있어요. 
                      이 특약은 대항력이 발생할 때까지 집주인이 소유권 이전이나 담보 설정 등을 하지 못하도록 제한해서 
                      <strong> 임차인의 보증금을 안전하게 보호</strong>해줘요.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-6">
                  <button
                    onClick={() => setSafetyTerms({...safetyTerms, rightsFreeze: 'select'})}
                    className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition text-xs font-medium ${
                      safetyTerms.rightsFreeze === 'select'
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-gray-300 hover:border-amber-400'
                    }`}
                  >
                    해당 특약 선택
                  </button>
                  <button
                    onClick={() => setSafetyTerms({...safetyTerms, rightsFreeze: 'skip'})}
                    className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition text-xs font-medium ${
                      safetyTerms.rightsFreeze === 'skip'
                        ? 'border-gray-400 bg-gray-100 text-gray-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    필요없음
                  </button>
                </div>
              </div>

              {/* 임대인 명의 계좌 송금 */}
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">임대인 본인 명의 계좌 송금 특약</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      보증금은 반드시 <strong className="text-amber-700">등기부등본에 나오는 실제 소유자(임대인) 본인 명의의 계좌</strong>로 
                      송금해야 해요. 제3자(가족, 지인, 중개인 등) 명의 계좌로 송금하면 나중에 사기나 분쟁이 발생했을 때 
                      <strong> 보증금 반환을 받지 못할 위험</strong>이 크니까, 이를 계약서에 명시해서 안전하게 보호받으세요.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-6">
                  <button
                    onClick={() => setSafetyTerms({...safetyTerms, ownerAccount: 'select'})}
                    className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition text-xs font-medium ${
                      safetyTerms.ownerAccount === 'select'
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-gray-300 hover:border-amber-400'
                    }`}
                  >
                    해당 특약 선택
                  </button>
                  <button
                    onClick={() => setSafetyTerms({...safetyTerms, ownerAccount: 'skip'})}
                    className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition text-xs font-medium ${
                      safetyTerms.ownerAccount === 'skip'
                        ? 'border-gray-400 bg-gray-100 text-gray-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    필요없음
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 최종 특약 목록 */}
          {specialTerms.length > 0 && (
            <div className="mb-6 print:break-before-page special-terms-section">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-red-500">
                ⚠️ 계약서에 포함할 특약 사항
              </h2>
              <div className="space-y-3">
                {specialTerms.map((term, index) => (
                  <div key={index} className="bg-red-50 border-l-4 border-red-500 p-3 rounded print:break-inside-avoid">
                    <h3 className="text-sm font-bold text-red-800 mb-1">[특약 {index + 1}] {term.title}</h3>
                    <p className="text-xs text-gray-700 leading-relaxed">"{term.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isMobile() ? '이미지 저장하기' : 'PDF 저장하기'}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              다시 작성하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = currentQuestion?.section;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 홈 버튼 */}
        <button
          onClick={handleGoHome}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition text-gray-700 hover:text-indigo-600 font-medium"
        >
          <Home className="w-5 h-5" />
          홈
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">임대차 계약 체크리스트</h1>
          </div>
          <p className="text-gray-600">나에게 맞는 조건을 설정하고 계약서 초안을 만들어보세요</p>
          {currentSection && (
            <div className="mt-3">
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                currentSection === '계약조건' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {currentSection}
              </span>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>질문 {step + 1} / {visibleQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{currentQuestion.question}</h2>
          <p className="text-gray-600 mb-8">{currentQuestion.description}</p>

          <div className="space-y-3">
            {/* 계약 유형 복수 선택 */}
            {currentQuestion.type === 'contractMultiple' && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  {currentQuestion.options.map((option) => {
                    const types = answers[currentQuestion.id]?.types || [];
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          const currentAnswer = answers[currentQuestion.id] || { types: [] };
                          const newTypes = types.includes(option)
                            ? types.filter(t => t !== option)
                            : [...types, option];
                          handleAnswer({ ...currentAnswer, types: newTypes });
                        }}
                        className={`flex-1 p-4 rounded-lg border-2 transition font-medium ${
                          types.includes(option)
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {answers[currentQuestion.id]?.types?.length > 0 && (
                  <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-lg">
                    {answers[currentQuestion.id].types.includes('전세') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          전세 보증금 범위
                        </label>
                        <input
                          type="text"
                          placeholder="예: 1억 ~ 1억5천, 5000만원 정도"
                          value={answers[currentQuestion.id]?.jeonse || ''}
                          onChange={(e) => {
                            const currentAnswer = answers[currentQuestion.id] || {};
                            handleAnswer({ ...currentAnswer, jeonse: e.target.value });
                          }}
                          className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    )}
                    
                    {answers[currentQuestion.id].types.includes('월세') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            월세 보증금 범위
                          </label>
                          <input
                            type="text"
                            placeholder="예: 1000만원 ~ 3000만원"
                            value={answers[currentQuestion.id]?.wolseDeposit || ''}
                            onChange={(e) => {
                              const currentAnswer = answers[currentQuestion.id] || {};
                              handleAnswer({ ...currentAnswer, wolseDeposit: e.target.value });
                            }}
                            className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            월세 범위
                          </label>
                          <input
                            type="text"
                            placeholder="예: 50만원 ~ 70만원"
                            value={answers[currentQuestion.id]?.wolseRent || ''}
                            onChange={(e) => {
                              const currentAnswer = answers[currentQuestion.id] || {};
                              handleAnswer({ ...currentAnswer, wolseRent: e.target.value });
                            }}
                            className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 입주 시기 */}
            {currentQuestion.type === 'moveInDate' && (
              <div className="space-y-3">
                {(!answers[currentQuestion.id] || answers[currentQuestion.id].type !== 'negotiable') && (
                  <>
                    <input
                      type="text"
                      placeholder={currentQuestion.placeholder}
                      value={answers[currentQuestion.id]?.value || ''}
                      onChange={(e) => handleAnswer({ type: 'specific', value: e.target.value })}
                      className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAnswer({ type: 'negotiable', value: '' })}
                      className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition font-medium"
                    >
                      협의가능
                    </button>
                  </>
                )}

                {answers[currentQuestion.id]?.type === 'negotiable' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAnswer({ type: 'negotiable', value: 'immediate' })}
                      className={`w-full p-4 rounded-lg border-2 transition font-medium ${
                        answers[currentQuestion.id]?.value === 'immediate'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      즉시입주 가능
                    </button>
                    <button
                      onClick={() => handleAnswer({ type: 'negotiable', value: 'undecided' })}
                      className={`w-full p-4 rounded-lg border-2 transition font-medium ${
                        answers[currentQuestion.id]?.value === 'undecided'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      입주계획 미정
                    </button>
                    <button
                      onClick={() => handleAnswer({ type: 'specific', value: '' })}
                      className="w-full p-3 text-gray-500 hover:text-gray-700 transition text-sm"
                    >
                      ← 뒤로 가기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 주거 형태 복수 선택 */}
            {currentQuestion.type === 'propertyTypeMultiple' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] || [];
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        if (option === '상관없음') {
                          handleAnswer(['상관없음']);
                        } else {
                          let newSelected;
                          if (selected.includes('상관없음')) {
                            newSelected = [option];
                          } else {
                            newSelected = selected.includes(option)
                              ? selected.filter(item => item !== option)
                              : [...selected, option];
                          }
                          handleAnswer(newSelected);
                        }
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        selected.includes(option)
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 단독/다가구 선택 시 안내문구 */}
            {currentQuestion.id === 'propertyType' && answers[currentQuestion.id] && 
             Array.isArray(answers[currentQuestion.id]) && 
             answers[currentQuestion.id].includes('단독/다가구') && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-300">
                <p className="text-sm text-gray-700 leading-relaxed">
                  💡 단독·다가구주택은 근저당 외에 기존 세입자의 보증금을 등기부로 확인할 수 없으므로, 계약 전 반드시 선순위 보증금을 확인해야 합니다.
                </p>
              </div>
            )}

            {/* 방과 화장실 개수 */}
            {currentQuestion.type === 'roomsAndBathrooms' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">방 개수 (거실 제외)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.roomOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          const currentAnswer = answers[currentQuestion.id] || {};
                          handleAnswer({ ...currentAnswer, rooms: option });
                        }}
                        className={`p-3 rounded-lg border-2 transition font-medium ${
                          answers[currentQuestion.id]?.rooms === option
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">화장실 개수</label>
                  <div className="grid grid-cols-3 gap-3">
                    {currentQuestion.bathroomOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          const currentAnswer = answers[currentQuestion.id] || {};
                          handleAnswer({ ...currentAnswer, bathrooms: option });
                        }}
                        className={`p-3 rounded-lg border-2 transition font-medium ${
                          answers[currentQuestion.id]?.bathrooms === option
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 층수 시각화 */}
            {currentQuestion.type === 'floorVisualClickable' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative">
                  <button
                    onClick={() => {
                      const current = answers[currentQuestion.id] || [];
                      const option = '고층 선호';
                      // 무관 제거 후 해당 옵션 토글
                      const withoutFloorPreference = current.filter(item => item !== '무관');
                      const updated = withoutFloorPreference.includes(option)
                        ? withoutFloorPreference.filter(item => item !== option)
                        : [...withoutFloorPreference, option];
                      handleAnswer(updated);
                    }}
                    className={`w-40 h-24 rounded-t-lg border-2 transition flex items-center justify-center ${
                      (answers[currentQuestion.id] || []).includes('고층 선호')
                        ? 'bg-indigo-100 border-indigo-600'
                        : 'bg-gray-300 border-gray-400 hover:bg-gray-400'
                    }`}
                  >
                    <div className={`text-sm font-bold ${
                      (answers[currentQuestion.id] || []).includes('고층 선호')
                        ? 'text-indigo-700'
                        : 'text-white'
                    }`}>고층</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const current = answers[currentQuestion.id] || [];
                      const option = '중층 선호';
                      // 무관 제거 후 해당 옵션 토글
                      const withoutFloorPreference = current.filter(item => item !== '무관');
                      const updated = withoutFloorPreference.includes(option)
                        ? withoutFloorPreference.filter(item => item !== option)
                        : [...withoutFloorPreference, option];
                      handleAnswer(updated);
                    }}
                    className={`w-40 h-24 border-2 border-t-0 transition flex items-center justify-center ${
                      (answers[currentQuestion.id] || []).includes('중층 선호')
                        ? 'bg-indigo-100 border-indigo-600'
                        : 'bg-gray-300 border-gray-400 hover:bg-gray-400'
                    }`}
                  >
                    <div className={`text-sm font-bold ${
                      (answers[currentQuestion.id] || []).includes('중층 선호')
                        ? 'text-indigo-700'
                        : 'text-white'
                    }`}>중층</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const current = answers[currentQuestion.id] || [];
                      const option = '저층 선호';
                      // 무관 제거 후 해당 옵션 토글
                      const withoutFloorPreference = current.filter(item => item !== '무관');
                      const updated = withoutFloorPreference.includes(option)
                        ? withoutFloorPreference.filter(item => item !== option)
                        : [...withoutFloorPreference, option];
                      handleAnswer(updated);
                    }}
                    className={`w-40 h-24 border-2 border-t-0 transition flex items-center justify-center ${
                      (answers[currentQuestion.id] || []).includes('저층 선호')
                        ? 'bg-indigo-100 border-indigo-600'
                        : 'bg-gray-300 border-gray-400 hover:bg-gray-400'
                    }`}
                  >
                    <div className={`text-sm font-bold ${
                      (answers[currentQuestion.id] || []).includes('저층 선호')
                        ? 'text-indigo-700'
                        : 'text-white'
                    }`}>저층</div>
                  </button>
                  
                  <div className="w-40 h-3 bg-gray-500"></div>
                </div>

                <button
                  onClick={() => {
                    const current = answers[currentQuestion.id] || [];
                    const option = '엘리베이터 필수';
                    // 엘리베이터는 독립적으로 토글 (무관 여부와 상관없이)
                    const updated = current.includes(option)
                      ? current.filter(item => item !== option)
                      : [...current, option];
                    handleAnswer(updated);
                  }}
                  className={`w-full max-w-md p-4 rounded-lg border-2 transition ${
                    (answers[currentQuestion.id] || []).includes('엘리베이터 필수')
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="font-medium">엘리베이터 필수</span>
                </button>

                <button
                  onClick={() => {
                    const current = answers[currentQuestion.id] || [];
                    const option = '무관';
                    // 무관 토글: 저층/중층/고층만 제거, 엘리베이터는 유지
                    if (current.includes(option)) {
                      // 무관 해제
                      handleAnswer(current.filter(item => item !== option));
                    } else {
                      // 무관 선택: 층수 선택 제거하고 무관 추가, 엘리베이터는 유지
                      const elevatorOnly = current.filter(item => item === '엘리베이터 필수');
                      handleAnswer([...elevatorOnly, option]);
                    }
                  }}
                  className={`w-full max-w-md p-4 rounded-lg border-2 transition ${
                    (answers[currentQuestion.id] || []).includes('무관')
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="font-medium">무관</span>
                </button>
              </div>
            )}

            {/* 옵션 아이콘 */}
            {currentQuestion.type === 'optionsWithIcons' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((item) => {
                    const Icon = item.icon;
                    const selected = answers[currentQuestion.id]?.selected || [];
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          const currentAnswer = answers[currentQuestion.id] || { selected: [] };
                          
                          if (item.name === '옵션 없어도 됨') {
                            if (selected.includes(item.name)) {
                              handleAnswer({ ...currentAnswer, selected: [] });
                            } else {
                              handleAnswer({ ...currentAnswer, selected: [item.name] });
                            }
                          } else {
                            if (selected.includes('옵션 없어도 됨')) {
                              handleAnswer({ ...currentAnswer, selected: [item.name] });
                            } else {
                              const newSelected = selected.includes(item.name)
                                ? selected.filter(n => n !== item.name)
                                : [...selected, item.name];
                              handleAnswer({ ...currentAnswer, selected: newSelected });
                            }
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                          selected.includes(item.name)
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {Icon && <Icon className="w-6 h-6 text-indigo-600" />}
                        <span className="font-medium text-sm">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기타 필요한 옵션
                  </label>
                  <input
                    type="text"
                    placeholder="예: 식기세척기, 건조기 등"
                    value={answers[currentQuestion.id]?.other || ''}
                    onChange={(e) => {
                      const currentAnswer = answers[currentQuestion.id] || {};
                      handleAnswer({ ...currentAnswer, other: e.target.value });
                    }}
                    disabled={(answers[currentQuestion.id]?.selected || []).includes('옵션 없어도 됨')}
                    className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {/* 반려동물 선택 with 상세 옵션 */}
            {currentQuestion.type === 'petsWithDetails' && (
              <div className="space-y-3">
                {(!answers[currentQuestion.id]?.hasPets || answers[currentQuestion.id]?.hasPets === '아니오') && (
                  currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        if (option === '예') {
                          handleAnswer({ hasPets: option, showDetails: true });
                        } else {
                          handleAnswer({ hasPets: option, completed: true });
                        }
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        answers[currentQuestion.id]?.hasPets === option
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                    </button>
                  ))
                )}

                {answers[currentQuestion.id]?.hasPets === '예' && answers[currentQuestion.id]?.showDetails && !answers[currentQuestion.id]?.needsClause && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-300">
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        💡 반려동물을 키운다고 해서 꼭 특약을 넣어야만 키울 수 있는 건 아니에요. 다만, 임대인이 미리 알지 못한 반려동물 입주로 인해 입주날에 분쟁이 생길 수도 있으니 사전에 알리는 것이 좋아요.
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        임대인이 반려동물을 키우는 것을 반대하는 경우, 임차인이 퇴거 시 벽지 혹은 장판을 교체해주는 조건으로 계약하는 경우가 있으며 이를 특약에 넣을 수 있어요.
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">반려동물 특약이 필요하신가요?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const current = answers[currentQuestion.id];
                            handleAnswer({ ...current, needsClause: 'yes', showClauseOptions: true, completed: true });
                          }}
                          className="flex-1 p-3 rounded-lg border-2 transition font-medium border-gray-200 hover:border-indigo-300"
                        >
                          특약 필요
                        </button>
                        <button
                          onClick={() => {
                            const current = answers[currentQuestion.id];
                            handleAnswer({ ...current, needsClause: 'no', completed: true });
                          }}
                          className="flex-1 p-3 rounded-lg border-2 transition font-medium border-gray-200 hover:border-gray-400"
                        >
                          필요없음
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {answers[currentQuestion.id]?.needsClause === 'yes' && answers[currentQuestion.id]?.showClauseOptions && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-300">
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        💡 반려동물을 키운다고 해서 꼭 특약을 넣어야만 키울 수 있는 건 아니에요. 다만, 임대인이 미리 알지 못한 반려동물 입주로 인해 입주날에 분쟁이 생길 수도 있으니 사전에 알리는 것이 좋아요.
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        임대인이 반려동물을 키우는 것을 반대하는 경우, 임차인이 퇴거 시 벽지 혹은 장판을 교체해주는 조건으로 계약하는 경우가 있으며 이를 특약에 넣을 수 있어요.
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-300">
                      <p className="text-sm font-medium text-gray-700 mb-3">특약에 포함할 내용</p>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-700">
                          ✓ 임차인은 반려동물을 동반하여 입주하며, 임대인은 이를 승낙함
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-indigo-200">
                          <p className="text-xs text-rose-400 mb-3">
                            💡 임대인이 반려동물 입주를 거부하는 경우, 하단의 특약을 제안하여 조율해볼 수 있습니다.
                          </p>
                          
                          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-indigo-100/50 transition">
                            <input
                              type="checkbox"
                              checked={answers[currentQuestion.id]?.includeRepair || false}
                              onChange={(e) => {
                                const current = answers[currentQuestion.id];
                                handleAnswer({ ...current, includeRepair: e.target.checked });
                              }}
                              className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-gray-700 font-medium block mb-1">특약에 포함하기</span>
                              <span className="text-xs text-gray-600 leading-relaxed">
                                임차인은 반려동물을 동반하여 입주하며, 임대인은 이를 승낙함. 단, 임차인은 반려동물에 의한 도배/장판 훼손 시 이를 교체하기로 한다.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {answers[currentQuestion.id]?.needsClause === 'no' && answers[currentQuestion.id]?.completed && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      반려동물 관련 특약을 포함하지 않아요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 텍스트 + 없음 버튼 */}
            {currentQuestion.type === 'textWithNone' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id] === 'none' ? '' : (answers[currentQuestion.id] || '')}
                  onChange={(e) => handleAnswer(e.target.value)}
                  disabled={answers[currentQuestion.id] === 'none'}
                  className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none disabled:bg-gray-100"
                />
                <button
                  onClick={() => handleAnswer('none')}
                  className={`w-full p-4 rounded-lg border-2 transition font-medium ${
                    answers[currentQuestion.id] === 'none'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  없음
                </button>
              </div>
            )}

            {/* 일반 라디오 */}
            {currentQuestion.type === 'radio' && currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  answers[currentQuestion.id] === option
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}

            {/* 설명이 있는 라디오 (관리비용) */}
            {currentQuestion.type === 'radioWithDescription' && currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  answers[currentQuestion.id] === option.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">{option.value}</div>
                <div className="text-sm text-rose-400">{option.description}</div>
              </button>
            ))}

            {/* Q4 계약 기간 안내문구 */}
            {currentQuestion.id === 'contractPeriod' && answers[currentQuestion.id] && 
             (answers[currentQuestion.id] === '1년' || answers[currentQuestion.id] === '1년 미만의 단기임대') && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
                <p className="text-sm text-gray-700 leading-relaxed">
                  💡 임차인은 주택임대차보호법에 따라 2년 미만으로 계약했더라도 2년의 계약 기간을 주장할 수 있어요. 
                </p>
              </div>
            )}

            {/* 텍스트 입력 */}
            {currentQuestion.type === 'text' && (
              <input
                type="text"
                placeholder={currentQuestion.placeholder}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
              />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || 
              (currentQuestion.type === 'contractMultiple' && (!answers[currentQuestion.id]?.types || answers[currentQuestion.id].types.length === 0)) ||
              (currentQuestion.type === 'contractMultiple' && answers[currentQuestion.id]?.types?.includes('전세') && !answers[currentQuestion.id]?.jeonse) ||
              (currentQuestion.type === 'contractMultiple' && answers[currentQuestion.id]?.types?.includes('월세') && (!answers[currentQuestion.id]?.wolseDeposit || !answers[currentQuestion.id]?.wolseRent)) ||
              (currentQuestion.type === 'moveInDate' && !answers[currentQuestion.id]?.value) ||
              (currentQuestion.type === 'propertyTypeMultiple' && (!answers[currentQuestion.id] || answers[currentQuestion.id].length === 0)) ||
              (currentQuestion.type === 'roomsAndBathrooms' && (!answers[currentQuestion.id]?.rooms || !answers[currentQuestion.id]?.bathrooms)) ||
              (currentQuestion.type === 'floorVisualClickable' && (!answers[currentQuestion.id] || answers[currentQuestion.id].length === 0)) ||
              (currentQuestion.type === 'optionsWithIcons' && (!answers[currentQuestion.id]?.selected || answers[currentQuestion.id].selected.length === 0)) ||
              (currentQuestion.type === 'petsWithDetails' && (!answers[currentQuestion.id]?.completed))}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === visibleQuestions.length - 1 ? '결과 보기' : '다음'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalChecklist;
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
      '원룸': { min: 150000, max: 300000 },
      '투룸': { min: 300000, max: 500000 },
      '쓰리룸 이상': { min: 500000, max: 800000 }
    };
    return costs[size] || null;
  };

  // 입주청소비용 범위
  const getCleaningCost = (size) => {
    const costs = {
      '원룸': { min: 80000, max: 150000 },
      '투룸': { min: 120000, max: 200000 },
      '쓰리룸 이상': { min: 180000, max: 300000 }
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
      question: '예상 관리비는 어느 정도인가요?',
      description: '아파트나 오피스텔은 평균 10~20만원 정도의 관리비가 나오고, 빌라나 다가구주택은 10만원 미만의 관리비가 나올 수 있어요.',
      type: 'text',
      placeholder: '예: 10만원 정도, 15~20만원',
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

  const handlePrint = () => {
    window.print();
  };

  const generateSpecialTerms = () => {
    const terms = [];

    if (answers.pets?.hasPets === '예' && answers.pets?.needsClause === 'yes') {
      let petClause = '임차인은 반려동물을 동반하여 입주하며, 임대인은 이를 승낙함';
      if (answers.pets?.includeRepair) {
        petClause += '. 임차인은 반려동물로 인한 도배, 장판의 교체가 필요할 경우 퇴거 시에 교체해주기로 함';
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
              </div>

              {/* 월세 입력 (선택) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월세 (만원) - 선택사항
                </label>
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
              <div className="space-y-2">
                {costData.deposit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">보증금:</span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(parseFloat(costData.deposit.replace(/,/g, '')) * 10000)}원
                    </span>
                  </div>
                )}
                {costData.monthlyRent && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">월세:</span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(parseFloat(costData.monthlyRent.replace(/,/g, '')) * 10000)}원
                    </span>
                  </div>
                )}
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
                src="data:image/png;base64,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" 
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
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  임대차계약 체크리스트와<br />맞춤특약 만들기
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  임대차계약<br />비용 계산하기
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
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 print:shadow-none">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:grid-cols-2 print:gap-3">
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
            <div className="mb-6 print:break-before-page">
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

          <div className="mt-6 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              PDF 저장하기
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
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answers[currentQuestion.id]?.includeRepair || false}
                            onChange={(e) => {
                              const current = answers[currentQuestion.id];
                              handleAnswer({ ...current, includeRepair: e.target.checked });
                            }}
                            className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            임대인이 반려동물 입주를 거부하는 경우: 퇴거 시 도배/장판 교체 조건을 특약에 포함하기
                          </span>
                        </label>
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

            {/* Q4 계약 기간 안내문구 */}
            {currentQuestion.id === 'contractPeriod' && answers[currentQuestion.id] && 
             (answers[currentQuestion.id] === '1년' || answers[currentQuestion.id] === '1년 미만의 단기임대') && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
                <p className="text-sm text-gray-700 leading-relaxed">
                  💡 임차인은 주택임대차보호법에 따라 2년 미만으로 계약했더라도 2년의 계약 기간을 주장할 수 있어요. 
                  임차인은 계약 기간이 1년인 경우에도 2년 동안 거주할 권리가 있으며, 필요한 경우 1년 만에 계약을 해지하고 보증금 반환을 요구할 수도 있어요. 
                  이와 반대로 임대인은 2년 미만의 계약 기간을 주장할 수 없어요.
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
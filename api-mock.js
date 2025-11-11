// api-mock.js
const ApiMock = {
  // 初始化数据（首次加载时运行）
  init() {
    const initialData = {
      facilities: [
        { type: 'badminton', count: 6, name: '羽毛球场' },
        { type: 'volleyball', count: 6, name: '排球场' },
        { type: 'tableTennis', count: 20, name: '乒乓球场' },
        { type: 'basketball', count: 6, name: '篮球场' },
        { type: 'football', count: 1, name: '足球场' }
      ],
      timeSlots: [
        { id: 'm1', name: '8:00~10:00', start: '08:00', end: '10:00' },
        { id: 'm2', name: '10:00~12:00', start: '10:00', end: '12:00' },
        { id: 'a1', name: '14:00~16:00', start: '14:00', end: '16:00' },
        { id: 'a2', name: '16:00~18:00', start: '16:00', end: '18:00' },
        { id: 'e1', name: '19:30~21:30', start: '19:30', end: '21:30' }
      ],
      reservations: [] // 预约记录
    };

    // 若localStorage中无数据，则初始化
    if (!localStorage.getItem('venueBookingData')) {
      localStorage.setItem('venueBookingData', JSON.stringify(initialData));
    }
  },

  // 获取数据
  _getData() {
    return JSON.parse(localStorage.getItem('venueBookingData') || '{}');
  },

  // 保存数据
  _saveData(data) {
    localStorage.setItem('venueBookingData', JSON.stringify(data));
  },

  // 1. 获取所有场地类型
  // GET地址: /api/facilities
  getFacilities() {
    const data = this._getData();
    return new Promise(resolve => {
      setTimeout(() => { // 模拟网络延迟
        resolve(data.facilities || []);
      }, 300);
    });
  },

  // 2. 获取所有时间段
  // GET地址: /api/time-slots
  getTimeSlots() {
    const data = this._getData();
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(data.timeSlots || []);
      }, 300);
    });
  },

  // 3. 获取可预约日期（未来2-7天）
  // GET地址: /api/available-dates
  getAvailableDates() {
    return new Promise(resolve => {
      setTimeout(() => {
        const dates = [];
        const today = new Date();
        // 生成未来2-7天的日期（格式：YYYY-MM-DD）
        for (let i = 2; i <= 7; i++) {
          const date = new Date();
          date.setDate(today.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        resolve(dates);
      }, 300);
    });
  },

  // 4. 检查指定日期和场地类型的可用场地
  // GET地址: /api/available-facilities
  // 请求参数: date (YYYY-MM-DD), type (场地类型标识)
  getAvailableFacilities({ date, type }) {
    return new Promise(resolve => {
      setTimeout(() => {
        const data = this._getData();
        // 查找场地总数
        const facility = data.facilities?.find(f => f.type === type);
        if (!facility) {
          resolve({ error: '场地类型不存在' });
          return;
        }

        // 计算每个时间段已预约的场地数量
        const timeSlotReservations = {};
        data.timeSlots?.forEach(slot => {
          timeSlotReservations[slot.id] = data.reservations?.filter(r => 
            r.date === date && r.type === type && r.timeSlotId === slot.id
          ).length || 0;
        });

        // 计算可用场地数量
        const available = {};
        Object.keys(timeSlotReservations).forEach(slotId => {
          available[slotId] = facility.count - timeSlotReservations[slotId];
        });

        resolve({ total: facility.count, available });
      }, 300);
    });
  },

  // 5. 提交预约
  // POST地址: /api/reserve
  // 请求参数: { name, phone, type, date, timeSlotId, facilityNumber }
  reserve(data) {
    return new Promise(resolve => {
      setTimeout(() => {
        const storeData = this._getData();
        const { name, phone, type, date, timeSlotId, facilityNumber } = data;

        // 验证必填项
        if (!name || !phone || !type || !date || !timeSlotId || !facilityNumber) {
          resolve({ error: '请填写完整预约信息' });
          return;
        }

        // 验证场地类型
        const facility = storeData.facilities?.find(f => f.type === type);
        if (!facility) {
          resolve({ error: '场地类型不存在' });
          return;
        }

        // 验证场地编号
        if (facilityNumber < 1 || facilityNumber > facility.count) {
          resolve({ error: '无效的场地编号' });
          return;
        }

        // 验证时间段
        const timeSlot = storeData.timeSlots?.find(s => s.id === timeSlotId);
        if (!timeSlot) {
          resolve({ error: '时间段不存在' });
          return;
        }

        // 检查冲突
        const isConflicted = storeData.reservations?.some(r => 
          r.type === type && 
          r.date === date && 
          r.timeSlotId === timeSlotId && 
          r.facilityNumber === facilityNumber
        );
        if (isConflicted) {
          resolve({ error: '该场地已被预约' });
          return;
        }

        // 创建预约记录
        const newReservation = {
          id: Date.now().toString(), // 用时间戳作为唯一ID
          name,
          phone,
          type,
          date,
          timeSlotId,
          timeSlotName: timeSlot.name,
          facilityNumber,
          createdAt: new Date().toISOString()
        };

        // 保存到本地存储
        storeData.reservations = [...(storeData.reservations || []), newReservation];
        this._saveData(storeData);

        resolve({ success: true, reservation: newReservation });
      }, 500);
    });
  },

  // 6. 查询用户预约记录
  // GET地址: /api/reservations
  // 请求参数: phone (手机号)
  getReservations({ phone }) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!phone) {
          resolve({ error: '请提供手机号' });
          return;
        }
        const data = this._getData();
        const userReservations = data.reservations?.filter(r => r.phone === phone) || [];
        resolve(userReservations);
      }, 300);
    });
  },

  // 7. 取消预约
  // DELETE地址: /api/reservations/:id
  // 请求参数: id (预约ID), phone (手机号)
  cancelReservation({ id, phone }) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!id || !phone) {
          resolve({ error: '参数不完整' });
          return;
        }

        const data = this._getData();
        const reservationIndex = data.reservations?.findIndex(r => r.id === id && r.phone === phone);
        if (reservationIndex === -1 || reservationIndex === undefined) {
          resolve({ error: '预约记录不存在' });
          return;
        }

        // 移除预约记录
        data.reservations.splice(reservationIndex, 1);
        this._saveData(data);
        resolve({ success: true });
      }, 500);
    });
  }
};

// 初始化数据
ApiMock.init();
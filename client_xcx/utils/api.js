const API_BASE = 'https://cofounder.icu/api';

function getToken() {
  return wx.getStorageSync('access_token') || '';
}

function setToken(token) {
  wx.setStorageSync('access_token', token);
}

function clearToken() {
  wx.removeStorageSync('access_token');
}

function request(method, path, data, options = {}) {
  const token = options.token !== undefined ? options.token : getToken();
  const header = { 'Content-Type': 'application/json' };
  if (token) {
    header['Authorization'] = 'Bearer ' + token;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + path,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          clearToken();
          wx.navigateTo({ url: '/pages/login/index' });
          reject(new Error('未授权，请重新登录'));
        } else {
          const errMsg = (res.data && res.data.message) || '请求失败';
          if (res.data && res.data.code === 'RISK_REVIEW_REQUIRED') {
            wx.showModal({
              title: '内容安全提示',
              content: '你的提交可能触发内容审查，是否继续？',
              success(modalRes) {
                if (modalRes.confirm && data && typeof data === 'object') {
                  data.riskConfirmed = true;
                  request(method, path, data, options).then(resolve).catch(reject);
                } else {
                  reject(new Error('用户取消'));
                }
              },
            });
          } else {
            reject(new Error(errMsg));
          }
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'));
      },
    });
  });
}

function sendLoginCode(email, inviteCode) {
  const body = { email };
  if (inviteCode) body.inviteCode = inviteCode;
  return request('POST', '/auth/send-code', body, { token: null });
}

function verifyLoginCode(email, code) {
  return request('POST', '/auth/verify-code', { email, code }, { token: null });
}

function fetchMe() {
  return request('GET', '/me');
}

function fetchCards(role) {
  const query = role ? '?role=' + role : '';
  return request('GET', '/platform/cards' + query, undefined, { token: null });
}

function fetchCardDetail(id) {
  return request('GET', '/platform/cards/' + id, undefined, { token: null });
}

function fetchOverview() {
  return request('GET', '/platform/overview', undefined, { token: null });
}

function fetchRequestStates() {
  return request('GET', '/platform/request-states', undefined, { token: null });
}

function saveBasicProfile(data) {
  return request('PUT', '/me/basic', data);
}

function updateMyCardBasic(cardId, data) {
  return request('PUT', '/me/card/' + cardId, data);
}

function deleteMyCard(cardId) {
  return request('DELETE', '/me/card/' + cardId);
}

function saveDetailProfile(data) {
  return request('PUT', '/me/detail', data);
}

function saveContactMethods(data) {
  return request('PUT', '/me/contacts', data);
}

function saveDisplayName(displayName) {
  return request('PUT', '/me/display-name', { displayName });
}

function fetchEngagements() {
  return request('GET', '/me/engagements');
}

function toggleEngagement(cardId, type, active) {
  return request('POST', '/me/engagements', { cardId, type, active });
}

function fetchMyRequests() {
  return request('GET', '/requests');
}

function createDetailRequest(cardId, data) {
  return request('POST', '/requests', Object.assign({ cardId }, data));
}

function approveRequest(requestId) {
  return request('POST', '/requests/' + requestId + '/approve');
}

function rejectRequest(requestId, reason) {
  return request('POST', '/requests/' + requestId + '/reject', { reason });
}

function viewRequesterDetail(requestId) {
  return request('POST', '/requests/' + requestId + '/view-requester-detail');
}

function exchangeContact(requestId) {
  return request('POST', '/requests/' + requestId + '/exchange-contact');
}

function declineContact(requestId, reason) {
  return request('POST', '/requests/' + requestId + '/decline-contact', { reason });
}

function markExchangeReviewing(requestId) {
  return request('POST', '/requests/' + requestId + '/mark-exchange-reviewing');
}

module.exports = {
  API_BASE,
  getToken,
  setToken,
  clearToken,
  sendLoginCode,
  verifyLoginCode,
  fetchMe,
  fetchCards,
  fetchCardDetail,
  fetchOverview,
  fetchRequestStates,
  saveBasicProfile,
  updateMyCardBasic,
  deleteMyCard,
  saveDetailProfile,
  saveContactMethods,
  saveDisplayName,
  fetchEngagements,
  toggleEngagement,
  fetchMyRequests,
  createDetailRequest,
  approveRequest,
  rejectRequest,
  viewRequesterDetail,
  exchangeContact,
  declineContact,
  markExchangeReviewing,
};

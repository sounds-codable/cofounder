function formatTime(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var now = new Date();
  var diff = now - d;
  var minute = 60 * 1000;
  var hour = 60 * minute;
  var day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + '分钟前';
  if (diff < day) return Math.floor(diff / hour) + '小时前';
  if (diff < 30 * day) return Math.floor(diff / day) + '天前';

  var y = d.getFullYear();
  var m = (d.getMonth() + 1).toString().padStart(2, '0');
  var dd = d.getDate().toString().padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

function truncate(str, len) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

function getRoleName(role) {
  if (role === 'expert') return '项目方';
  if (role === 'developer') return '程序员';
  return role || '';
}

function getRequestStatusText(status) {
  var map = {
    pending_request: '等待回应',
    publisher_viewed_detail: '已查看你的详情',
    approved_detail_visible: '已批准，可查看详情',
    contact_exchanged: '已交换联系方式',
    rejected: '已拒绝',
    requester_declined_contact: '请求方拒绝交换',
    exchange_reviewing: '交换审核中',
  };
  return map[status] || status || '';
}

function getRequestStatusColor(status) {
  if (status === 'contact_exchanged') return '#13bfa8';
  if (status === 'rejected' || status === 'requester_declined_contact') return '#dc4d4d';
  if (status === 'approved_detail_visible') return '#3bc9f5';
  return '#597693';
}

function isLoggedIn() {
  return !!wx.getStorageSync('access_token');
}

function requireLogin(nextUrl) {
  if (isLoggedIn()) return true;
  var url = '/pages/login/index';
  if (nextUrl) url += '?next=' + encodeURIComponent(nextUrl);
  wx.navigateTo({ url: url });
  return false;
}

module.exports = {
  formatTime,
  truncate,
  getRoleName,
  getRequestStatusText,
  getRequestStatusColor,
  isLoggedIn,
  requireLogin,
};

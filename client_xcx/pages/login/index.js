var api = require('../../utils/api');

Page({
  data: {
    step: 'email',
    email: '',
    code: '',
    inviteCode: '',
    showInviteCode: false,
    sending: false,
    verifying: false,
    errMsg: '',
    nextUrl: '',
  },

  onLoad: function (options) {
    if (options.next) {
      this.setData({ nextUrl: decodeURIComponent(options.next) });
    }
    if (options.invite) {
      this.setData({ inviteCode: options.invite, showInviteCode: true });
    }
    if (api.getToken()) {
      this.navigateBack();
    }
  },

  onEmailInput: function (e) {
    this.setData({ email: e.detail.value, errMsg: '' });
  },

  onCodeInput: function (e) {
    this.setData({ code: e.detail.value, errMsg: '' });
  },

  onInviteInput: function (e) {
    this.setData({ inviteCode: e.detail.value, errMsg: '' });
  },

  sendCode: function () {
    var that = this;
    var email = this.data.email.trim();
    if (!email) {
      this.setData({ errMsg: '请输入邮箱地址' });
      return;
    }
    this.setData({ sending: true, errMsg: '' });
    api
      .sendLoginCode(email, this.data.inviteCode)
      .then(function () {
        that.setData({ step: 'code', sending: false });
      })
      .catch(function (err) {
        var msg = err.message || '发送失败';
        if (msg.indexOf('INVITE_CODE_REQUIRED') !== -1 || msg.indexOf('邀请码') !== -1) {
          that.setData({ showInviteCode: true, sending: false, errMsg: '需要邀请码才能注册' });
        } else {
          that.setData({ sending: false, errMsg: msg });
        }
      });
  },

  verifyCode: function () {
    var that = this;
    var code = this.data.code.trim();
    if (!code) {
      this.setData({ errMsg: '请输入验证码' });
      return;
    }
    this.setData({ verifying: true, errMsg: '' });
    api
      .verifyLoginCode(this.data.email.trim(), code)
      .then(function (res) {
        api.setToken(res.accessToken);
        var app = getApp();
        app.globalData.userInfo = res.user || null;
        app.checkLogin();
        that.setData({ verifying: false });
        that.navigateBack();
      })
      .catch(function (err) {
        that.setData({ verifying: false, errMsg: err.message || '验证失败' });
      });
  },

  backToEmail: function () {
    this.setData({ step: 'email', code: '', errMsg: '' });
  },

  navigateBack: function () {
    var next = this.data.nextUrl;
    if (next) {
      wx.redirectTo({ url: next });
    } else {
      wx.switchTab({ url: '/pages/projects/index' });
    }
  },
});

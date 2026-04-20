var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    loggedIn: false,
    loading: true,
    activeTab: 'incoming',
    incoming: [],
    outgoing: [],
    incomingCount: 0,
    outgoingCount: 0,
  },

  onShow: function () {
    this.setData({ loggedIn: util.isLoggedIn() });
    if (this.data.loggedIn) {
      this.loadRequests();
    } else {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh: function () {
    var that = this;
    if (!this.data.loggedIn) {
      wx.stopPullDownRefresh();
      return;
    }
    this.loadRequests().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  formatRequest: function (r) {
    var card = r.targetCard || {};
    var headline = card.headline || r.cardHeadline || '';
    var role = card.role || '';
    var roleName = util.getRoleName(role);
    var displayTitle = headline || '未知卡片';
    if (roleName) {
      displayTitle = '[' + roleName + '] ' + displayTitle;
    }

    return Object.assign({}, r, {
      displayTitle: displayTitle,
      cardId: card.id || r.cardId || '',
      cardCity: card.city || '',
      cardOwnerName: card.ownerName || '',
      statusText: util.getRequestStatusText(r.status),
      statusClass: r.status === 'contact_exchanged' ? 'status-success' : r.status === 'rejected' ? 'status-error' : 'status-pending',
      createdAtText: util.formatTime(r.createdAt),
      requesterName: r.requester ? r.requester.displayName : (r.requesterDisplayName || ''),
      publisherName: r.publisher ? r.publisher.displayName : '',
      exchangedContacts: r.publisher ? r.publisher.contactMethods : (r.exchangedContacts || null),
    });
  },

  loadRequests: function () {
    var that = this;
    this.setData({ loading: true });
    return api
      .fetchMyRequests()
      .then(function (res) {
        var incoming = (res.incoming || []).map(function (r) {
          return that.formatRequest(r);
        });
        var outgoing = (res.outgoing || []).map(function (r) {
          return that.formatRequest(r);
        });
        that.setData({
          incoming: incoming,
          outgoing: outgoing,
          incomingCount: incoming.length,
          outgoingCount: outgoing.length,
          loading: false,
        });
      })
      .catch(function () {
        that.setData({ loading: false });
      });
  },

  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  goLogin: function () {
    wx.navigateTo({ url: '/pages/login/index?next=' + encodeURIComponent('/pages/requests/index') });
  },

  viewRequester: function (e) {
    var rid = e.currentTarget.dataset.rid;
    var that = this;
    api
      .viewRequesterDetail(rid)
      .then(function () {
        wx.showToast({ title: '已查看', icon: 'success' });
        that.loadRequests();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  approveReq: function (e) {
    var rid = e.currentTarget.dataset.rid;
    var that = this;
    api
      .approveRequest(rid)
      .then(function () {
        wx.showToast({ title: '已批准', icon: 'success' });
        that.loadRequests();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  rejectReq: function (e) {
    var rid = e.currentTarget.dataset.rid;
    var that = this;
    wx.showModal({
      title: '拒绝理由',
      editable: true,
      placeholderText: '请输入拒绝理由（可选）',
      success: function (res) {
        if (res.confirm) {
          api
            .rejectRequest(rid, res.content || '')
            .then(function () {
              wx.showToast({ title: '已拒绝', icon: 'success' });
              that.loadRequests();
            })
            .catch(function (err) {
              wx.showToast({ title: err.message || '操作失败', icon: 'none' });
            });
        }
      },
    });
  },

  doExchange: function (e) {
    var rid = e.currentTarget.dataset.rid;
    var that = this;
    var app = getApp();
    var profile = app.globalData.userInfo;
    if (!profile || !profile.contactMethods || profile.contactMethods.length === 0) {
      wx.showModal({
        title: '填写联系方式',
        content: '交换前需要先填写你的联系方式。',
        confirmText: '去填写',
        success: function (res) {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/index' });
          }
        },
      });
      return;
    }
    api
      .exchangeContact(rid)
      .then(function () {
        wx.showToast({ title: '已交换', icon: 'success' });
        that.loadRequests();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  doDecline: function (e) {
    var rid = e.currentTarget.dataset.rid;
    var that = this;
    wx.showModal({
      title: '拒绝理由',
      editable: true,
      placeholderText: '请输入拒绝理由（可选）',
      success: function (res) {
        if (res.confirm) {
          api
            .declineContact(rid, res.content || '')
            .then(function () {
              wx.showToast({ title: '已拒绝', icon: 'success' });
              that.loadRequests();
            })
            .catch(function (err) {
              wx.showToast({ title: err.message || '操作失败', icon: 'none' });
            });
        }
      },
    });
  },

  goCardDetail: function (e) {
    var cardId = e.currentTarget.dataset.cardId;
    if (cardId) {
      wx.navigateTo({ url: '/pages/card-detail/index?id=' + cardId });
    }
  },
});

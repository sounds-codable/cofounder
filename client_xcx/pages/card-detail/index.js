var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    card: null,
    loading: true,
    roleName: '',
    publishedAtText: '',
    isOwner: false,
    isLiked: false,
    isFavorited: false,
    requestState: '',
    requestId: '',
    revealedDetail: null,
    contactMethods: null,
    incomingRequests: [],
  },

  onLoad: function (options) {
    this.cardId = options.id;
    this.loadDetail();
  },

  onShow: function () {
    if (this.cardId && !this.data.loading) {
      this.loadRequestState();
    }
  },

  loadDetail: function () {
    var that = this;
    this.setData({ loading: true });
    api
      .fetchCardDetail(this.cardId)
      .then(function (card) {
        var app = getApp();
        var profile = app.globalData.userInfo;
        var isOwner = profile && profile.card && profile.card.id === card.id;

        that.setData({
          card: card,
          roleName: util.getRoleName(card.role),
          publishedAtText: util.formatTime(card.publishedAt || card.createdAt),
          isOwner: isOwner,
          isLiked: app.isLiked(card.id),
          isFavorited: app.isFavorited(card.id),
          loading: false,
        });

        that.loadRequestState();
      })
      .catch(function () {
        that.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  loadRequestState: function () {
    if (!api.getToken()) return;
    var that = this;
    api.fetchMyRequests().then(function (res) {
      var cardId = that.cardId;
      var profile = getApp().globalData.userInfo;
      var isOwner = that.data.isOwner;

      if (!isOwner) {
        var outgoing = (res.outgoing || []).find(function (r) {
          return r.cardId === cardId;
        });
        if (outgoing) {
          that.setData({
            requestState: outgoing.status,
            requestId: outgoing.id,
            revealedDetail: outgoing.publisherDetailSnapshot || null,
            contactMethods: outgoing.exchangedContacts || null,
          });
        }
      } else {
        var incoming = (res.incoming || []).filter(function (r) {
          return r.cardId === cardId;
        });
        that.setData({
          incomingRequests: incoming.map(function (r) {
            return Object.assign({}, r, {
              statusText: util.getRequestStatusText(r.status),
              statusClass: r.status === 'contact_exchanged' ? 'status-success' : r.status === 'rejected' ? 'status-error' : 'status-pending',
            });
          }),
        });
      }
    });
  },

  goBack: function () {
    var role = this.data.card && this.data.card.role;
    if (role === 'developer') {
      wx.switchTab({ url: '/pages/developers/index' });
    } else {
      wx.switchTab({ url: '/pages/projects/index' });
    }
  },

  toggleLike: function () {
    if (!util.requireLogin()) return;
    var active = !this.data.isLiked;
    this.setData({ isLiked: active });
    api.toggleEngagement(this.cardId, 'like', active).catch(function () {});
  },

  toggleFavorite: function () {
    if (!util.requireLogin()) return;
    var active = !this.data.isFavorited;
    this.setData({ isFavorited: active });
    api.toggleEngagement(this.cardId, 'favorite', active).catch(function () {});
  },

  sendRequest: function () {
    if (!util.requireLogin()) return;
    var app = getApp();
    var profile = app.globalData.userInfo;
    if (!profile || !profile.completion || !profile.completion.hasDetailProfile) {
      wx.showModal({
        title: '完善信息',
        content: '发送请求前，需要先完善你的详细信息，以便对方了解你。',
        confirmText: '去填写',
        success: function (res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/detail-profile/index' });
          }
        },
      });
      return;
    }
    var that = this;
    wx.showLoading({ title: '发送中...' });
    api
      .createDetailRequest(this.cardId, {})
      .then(function () {
        wx.hideLoading();
        wx.showToast({ title: '请求已发送', icon: 'success' });
        that.loadRequestState();
      })
      .catch(function (err) {
        wx.hideLoading();
        wx.showToast({ title: err.message || '发送失败', icon: 'none' });
      });
  },

  requestExchange: function () {
    var that = this;
    if (!this.data.requestId) return;
    var app = getApp();
    var profile = app.globalData.userInfo;
    if (!profile || !profile.contactMethods || profile.contactMethods.length === 0) {
      wx.showModal({
        title: '填写联系方式',
        content: '交换联系方式前，需要先填写你的联系方式。',
        confirmText: '去填写',
        success: function (res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/profile/index' });
          }
        },
      });
      return;
    }
    api
      .markExchangeReviewing(this.data.requestId)
      .then(function () {
        wx.showToast({ title: '已提交', icon: 'success' });
        that.loadRequestState();
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      });
  },

  goEdit: function () {
    var card = this.data.card;
    if (!card) return;
    wx.navigateTo({ url: '/pages/publish/index?role=' + card.role + '&edit=1' });
  },

  deleteCard: function () {
    var that = this;
    var card = this.data.card;
    if (!card) return;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这个卡片吗？',
      confirmColor: '#dc4d4d',
      success: function (res) {
        if (res.confirm) {
          api
            .deleteMyCard(card.id)
            .then(function () {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(function () {
                that.goBack();
              }, 800);
            })
            .catch(function (err) {
              wx.showToast({ title: err.message || '删除失败', icon: 'none' });
            });
        }
      },
    });
  },

  viewRequester: function (e) {
    var rid = e.currentTarget.dataset.rid;
    var that = this;
    api
      .viewRequesterDetail(rid)
      .then(function () {
        wx.showToast({ title: '已查看', icon: 'success' });
        that.loadRequestState();
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
        that.loadRequestState();
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
              that.loadRequestState();
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
            wx.navigateTo({ url: '/pages/profile/index' });
          }
        },
      });
      return;
    }
    api
      .exchangeContact(rid)
      .then(function () {
        wx.showToast({ title: '已交换', icon: 'success' });
        that.loadRequestState();
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
              that.loadRequestState();
            })
            .catch(function (err) {
              wx.showToast({ title: err.message || '操作失败', icon: 'none' });
            });
        }
      },
    });
  },
});

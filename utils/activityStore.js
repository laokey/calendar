const STORAGE_KEY = 'activity_state_v1'

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDateTime(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function seedState() {
  const now = Date.now()
  const dt = formatDateTime(now)

  return {
    version: 1,
    dynamics: [
      {
        id: uid('dy'),
        who: { name: '妹妹', glyph: '妹', color: '#34c38f' },
        whenText: '16分钟',
        action: 'done',
        task: { title: '洗碗', points: +2, icon: 'bowl' },
        detail: {
          dateText: '2026年3月31日星期二-全天',
          repeatText: '每日',
          starText: '2',
          assignTo: { name: '爸爸', glyph: '爸', color: '#ffb020' },
          doneAtText: '完成于 2026.03.31 21:13',
        },
        createdAt: dt,
        createdAtTs: now,
      },
      {
        id: uid('dy'),
        who: { name: '妹妹', glyph: '妹', color: '#34c38f' },
        whenText: '16分钟',
        action: 'cancel',
        task: { title: '洗碗', points: -2, icon: 'bowl' },
        detail: {
          dateText: '2026年3月31日星期二-全天',
          repeatText: '每日',
          starText: '2',
          assignTo: { name: '爸爸', glyph: '爸', color: '#ffb020' },
          doneAtText: '取消于 2026.03.31 21:13',
        },
        createdAt: dt,
        createdAtTs: now - 120000,
      },
      {
        id: uid('dy'),
        who: { name: '爸爸', glyph: '爸', color: '#ffb020' },
        whenText: '16分钟',
        action: 'cancel',
        task: { title: '跑步', points: -2, icon: 'run' },
        detail: {
          dateText: '2026年3月31日星期二-全天',
          repeatText: '每日',
          starText: '2',
          assignTo: { name: '爸爸', glyph: '爸', color: '#ffb020' },
          doneAtText: '取消于 2026.03.31 21:13',
        },
        createdAt: dt,
        createdAtTs: now - 240000,
      },
      {
        id: uid('dy'),
        who: { name: '妈妈', glyph: '妈', color: '#ff8a3d' },
        whenText: '16分钟',
        action: 'done',
        task: { title: '跑步', points: +2, icon: 'run' },
        detail: {
          dateText: '2026年3月31日星期二-全天',
          repeatText: '每日',
          starText: '2',
          assignTo: { name: '爸爸', glyph: '爸', color: '#ffb020' },
          doneAtText: '完成于 2026.03.31 21:13',
        },
        createdAt: dt,
        createdAtTs: now - 360000,
      },
    ],
    notices: [
      {
        id: uid('no'),
        type: 'message',
        title: '系统消息',
        subject: '关于系统升级的通知',
        timeText: '2026.09.23 09:32:21',
        preview:
          '为了让您更好的使用资源平台,我们正在对平台进行升级。升级期间暂时无法访问。给您带来的不便,敬请谅解',
        content:
          '尊敬的各位用户：\n为进一步优化APP使用体验，提升系统稳定性与功能实用性，修复已知问题，为大家提供更流畅、安全、便捷的服务，我们即将对APP系统进行全面升级。本次升级不影响用户核心数据（如账号信息、历史操作记录等），请各位用户知悉并配合完成升级，具体详情如下：\n\n一、升级时间\n本次升级分为两个阶段，保障用户使用不受过度影响：\n1、预约升级阶段：2026年4月1日 00:00 — 2026年4月3日 23:59，用户可自行在APP内点击“我的-设置-版本更新”，主动完成升级，升级过程不影响APP正常使用；\n2、强制升级阶段：2026年4月4日 00:00 起，未完成主动升级的用户，打开APP后将弹出强制升级弹窗，需完成升级后才可正常使用APP，预计单次升级耗时1-3分钟（具体以网络速度为准）。\n\n二、升级范围\n本次升级覆盖全平台APP用户，包括iOS版（iOS 12.0及以上版本）、Android版（Android 8.0及以上版本），低于上述系统版本的设备，需先升级手机系统，方可完成APP升级。\n\n三、升级核心内容\n本次升级聚焦体验优化、功能迭代与安全加固。\n\n给您带来的不便，敬请谅解。',
      },
      {
        id: uid('no'),
        type: 'announce',
        title: '系统公告',
        subject: '关于系统升级的通知',
        timeText: '2026.09.23 09:32:21',
        preview:
          '为了让您更好的使用资源平台,我们正在对平台进行升级。升级期间暂时无法访问。给您带来的不便,敬请谅解',
        content:
          '尊敬的各位用户：\n本公告用于展示通知详情页面效果，后续可替换为真实公告内容。\n\n升级期间服务可能短暂不可用，请提前做好安排。',
      },
    ],
    invites: [
      {
        id: uid('iv'),
        from: { name: '妹妹', glyph: '妹', color: '#34c38f' },
        timeText: '2026.09.23 09:32:21',
        calendarName: '妹妹的日历',
        status: 'pending',
      },
      {
        id: uid('iv'),
        from: { name: 'GRAGRA', glyph: 'G', color: '#ffb020' },
        timeText: '2026.09.23 09:32:21',
        calendarName: 'GRAGRA的日历',
        status: 'pending',
      },
      {
        id: uid('iv'),
        from: { name: 'GRAGRA', glyph: 'G', color: '#ff5a5f' },
        timeText: '2026.09.23 09:32:21',
        calendarName: 'GRAGRA的日历',
        status: 'pending',
      },
      {
        id: uid('iv'),
        from: { name: 'GRAGRA', glyph: 'G', color: '#3d6afb' },
        timeText: '2026.09.23 09:32:21',
        calendarName: 'GRAGRA的日历',
        status: 'pending',
      },
    ],
  }
}

export function loadActivityState() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return seedState()
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!state || typeof state !== 'object') return seedState()
    if (!Array.isArray(state.dynamics) || !Array.isArray(state.notices) || !Array.isArray(state.invites)) return seedState()
    return state
  } catch (e) {
    return seedState()
  }
}

export function saveActivityState(state) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
}

export function ensureActivityState() {
  const state = loadActivityState()
  saveActivityState(state)
  return state
}

export function removeDynamic(state, id) {
  state.dynamics = (state.dynamics || []).filter((x) => x.id !== id)
  saveActivityState(state)
}

export function updateDynamic(state, id, patch) {
  const item = (state.dynamics || []).find((x) => x.id === id)
  if (!item) return false
  Object.assign(item, patch || {})
  saveActivityState(state)
  return true
}

export function findDynamic(state, id) {
  return (state.dynamics || []).find((x) => x.id === id) || null
}

export function findNotice(state, id) {
  return (state.notices || []).find((x) => x.id === id) || null
}

export function removeInvite(state, id) {
  state.invites = (state.invites || []).filter((x) => x.id !== id)
  saveActivityState(state)
}

export function setInviteStatus(state, id, status) {
  const item = (state.invites || []).find((x) => x.id === id)
  if (!item) return false
  item.status = status
  saveActivityState(state)
  return true
}


<template>
  <view class="bl-page">
    <BlHeader back>
      <template #center>
        <view class="center">
          <view class="mini-icon" />
          <text class="title">{{ calendarName }}</text>
        </view>
      </template>
    </BlHeader>

    <view class="top-card">
      <view v-if="active" class="bl-card device-card">
        <view class="bl-status-tag"><text>{{ $t('已激活') }}</text></view>
        <view class="bl-row">
          <view class="thumb">
            <image
              class="thumb-img"
              src="/static/device/device_hero_plain.png"
              mode="aspectFit"
            />
          </view>
          <view class="meta">
            <text class="name">{{ calendarName }}</text>
            <text class="email bl-muted">{{ $t('发送事件：') }}{{ calendarEmail }}</text>
          </view>
        </view>
      </view>
      <view v-else class="bl-card activate-card">
        <view class="hero">
          <image
            class="device-img"
            src="/static/device/device_hero_plain.png"
            mode="aspectFit"
          />
        </view>
        <text class="activate-title">{{ $t('准备激活设备？') }}</text>
        <text class="activate-desc bl-muted">{{ $t('激活设备后，下拉可刷新应用') }}</text>
        <view class="bl-btn-primary" @click="goActivate">
          <text>{{ $t('激活设备') }}</text>
          <view class="bl-btn-arrow">
            <text class="arrow">→</text>
          </view>
        </view>
      </view>

      <view class="bl-card-soft" :class="todayTasks.length ? 'day-card' : 'day-empty'">
        <text class="day-title">{{ todayTitleText }}</text>
        <view v-if="todayTasks.length" class="task-list">
          <view
            v-for="t in todayTasks"
            :key="t.id"
            class="task-card"
            :class="t.cls"
            :style="{ background: t.bg }"
          >
            <view class="task-left">
              <text class="task-title">{{ t.title }}</text>
              <view class="task-time">
                <image
                  class="clock"
                  src="/static/calendar/icon_form_clock.png"
                  mode="aspectFit"
                />
                <text class="time-text">{{ t.timeText }}</text>
              </view>
            </view>
            <view
              v-if="t.right.type === 'single'"
              class="bl-avatar"
              :style="avatarStyle(t.right.color)"
              ><text>{{ t.right.glyph }}</text></view
            >
            <view v-else class="avatars">
              <view
                v-for="a in t.right.avatars"
                :key="a.color + a.glyph"
                class="bl-avatar"
                :style="avatarStyle(a.color)"
                ><text>{{ a.glyph }}</text></view
              >
            </view>
          </view>
        </view>
        <view v-else class="empty-activity">
          <image
            class="empty-icon"
            src="/static/home/icon_none_activity.png"
            mode="aspectFit"
          />
          <text class="empty-text bl-muted">{{ $t('今天没有活动') }}</text>
        </view>
      </view>
    </view>

    <view class="grid">
      <view
        v-for="item in menus"
        :key="item.title"
        class="tile"
        :class="item.cls"
        @click="open(item.title)"
      >
        <view class="tile-icon"
          ><image class="tile-icon-img" :src="item.icon" mode="aspectFit"
        /></view>
        <text class="tile-title">{{ item.title }}</text>
        <text class="tile-sub bl-muted">{{ item.sub }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import BlHeader from "../../components/BlHeader.vue";
import { calendarApi, deviceApi, membersApi, tasksApi } from "../../utils/api";
import { getAlbumList } from "../../utils/api/gallery";
import { ensureCalendarState, eventsForDate, listMembers } from "../../utils/calendarStore";
import { ensureTaskState, isTaskDone, tasksForDate } from "../../utils/taskStore";

const active = ref(false);
const calendarName = ref(uni.$t('芝麻日历'));
const calendarEmail = ref("");
const memberItems = ref([]);
const todayEventsRaw = ref([]);
const homeStats = ref({
  calendarCount: 0,
  taskPendingCount: 0,
  listCount: 0,
  galleryFileCount: 0,
  memberCount: 0,
});
const HOME_EVENT_PREVIEW_LIMIT = 4;

const BASE_MENUS = () => [
  { title: uni.$t('日历'), sub: uni.$t('今天没有活动'), icon: "/static/home/icon_menu_calendar.png", cls: "is-purple" },
  { title: uni.$t('任务'), sub: uni.$t('剩余{n}个', { n: 0 }), icon: "/static/home/icon_menu_tasks.png", cls: "is-blue" },
  { title: uni.$t('奖励'), sub: uni.$t('大胆和小目标'), icon: "/static/home/icon_menu_rewards.png", cls: "is-salmon" },
  { title: uni.$t('清单'), sub: uni.$t('{n}清单', { n: 0 }), icon: "/static/home/icon_menu_list.png", cls: "is-green" },
  { title: uni.$t('餐食'), sub: uni.$t('我们吃什么'), icon: "/static/home/icon_menu_meals.png", cls: "is-orange" },
  { title: uni.$t('相册'), sub: uni.$t('{n}个文件', { n: 0 }), icon: "/static/home/icon_menu_gallery.png", cls: "is-red" },
  // { title: uni.$t('同步'), sub: uni.$t('同步在线日历'), icon: "/static/home/icon_menu_sync.png", cls: "is-mint" },   // 同步功能暂未开放
  { title: uni.$t('成员管理'), sub: uni.$t('{n}个成员', { n: 0 }), icon: "/static/home/icon_menu_users.png", cls: "is-indigo" },
  { title: uni.$t('设备管理'), sub: uni.$t('控制功能'), icon: "/static/home/icon_menu_devices.png", cls: "is-blue2" },
  { title: uni.$t('用户管理'), sub: uni.$t('邀请你爱的人'), icon: "/static/home/icon_menu_members.png", cls: "is-indigo2" },
  { title: uni.$t('通知'), sub: uni.$t('通知事件'), icon: "/static/home/icon_menu_notice.png", cls: "is-salmon2" },
  { title: uni.$t('贺卡'), sub: uni.$t('给设备推送祝福'), icon: "/static/home/icon_menu_cards.png", cls: "is-orange2" },
];

const todayTitleText = computed(() => formatTodayTitle(new Date()));
const todayTasks = computed(() => {
  const list = Array.isArray(todayEventsRaw.value) ? todayEventsRaw.value : [];
  return list.slice(0, HOME_EVENT_PREVIEW_LIMIT).map((event, idx) => formatHomeEventCard(event, idx));
});
const menus = computed(() => {
  const stats = homeStats.value || {};
  return BASE_MENUS().map((item) => {
    if (item.title === uni.$t('日历')) {
      return {
        ...item,
        sub: stats.calendarCount > 0 ? uni.$t('今日{n}个活动', { n: stats.calendarCount }) : uni.$t('今天没有活动'),
      };
    }
    if (item.title === uni.$t('任务')) {
      return { ...item, sub: uni.$t('剩余{n}个', { n: stats.taskPendingCount || 0 }) };
    }
    if (item.title === uni.$t('清单')) {
      return { ...item, sub: uni.$t('{n}清单', { n: stats.listCount || 0 }) };
    }
    if (item.title === uni.$t('相册')) {
      return { ...item, sub: uni.$t('{n}个文件', { n: stats.galleryFileCount || 0 }) };
    }
    if (item.title === uni.$t('成员管理')) {
      return { ...item, sub: uni.$t('{n}个成员', { n: stats.memberCount || 0 }) };
    }
    return item;
  });
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentLocaleTag() {
  try {
    const locale = typeof uni.getLocale === "function" ? uni.getLocale() : "";
    return String(locale || "zh-CN");
  } catch (e) {
    return "zh-CN";
  }
}

function formatTodayTitle(date) {
  const d = date instanceof Date ? date : new Date();
  try {
    return new Intl.DateTimeFormat(currentLocaleTag(), {
      weekday: "long",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch (e) {
    const weekdayMap = [uni.$t('星期日'), uni.$t('星期一'), uni.$t('星期二'), uni.$t('星期三'), uni.$t('星期四'), uni.$t('星期五'), uni.$t('星期六')];
    return `${weekdayMap[d.getDay()]} ${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
}

function formatDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function homeEventQueryRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    today: formatDateKey(today),
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
  };
}

function loadContext() {
  try {
    const storedName = String(uni.getStorageSync("active_device_name_v1") || "").trim();
    const storedEmail = String(uni.getStorageSync("active_device_email_v1") || "").trim();
    if (storedName) calendarName.value = storedName;
    if (storedEmail) calendarEmail.value = storedEmail;
  } catch (e) {}
  try {
    const raw = uni.getStorageSync("calendar_detail_ctx_v1");
    const ctx = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
    if (ctx && typeof ctx === "object") {
      if (ctx.name) calendarName.value = String(ctx.name);
      if (ctx.email) calendarEmail.value = String(ctx.email);
    }
  } catch (e) {}
}

async function ensureCalendarEmail() {
  const direct = String(calendarEmail.value || "").trim();
  if (direct) return direct;
  try {
    const stored = String(uni.getStorageSync("active_device_email_v1") || "").trim();
    if (stored) {
      calendarEmail.value = stored;
      return stored;
    }
  } catch (e) {}
  const logged = !!uni.getStorageSync("auth_logged_in");
  if (!logged) return "";
  try {
    const devices = await deviceApi.getCalendarDeviceList();
    const current = Array.isArray(devices)
      ? devices.find((item) => Number(item && item.status) === 1) || devices[0]
      : null;
    const email = current && current.deviceEmail ? String(current.deviceEmail).trim() : "";
    if (!email) return "";
    calendarEmail.value = email;
    if (current && current.deviceName) calendarName.value = String(current.deviceName);
    try {
      uni.setStorageSync("active_device_email_v1", email);
    } catch (e) {}
    return email;
  } catch (e) {
    return "";
  }
}

async function syncDeviceActivationStatus() {
  const email = await ensureCalendarEmail();
  if (!email) {
    active.value = false;
    return false;
  }
  const logged = !!uni.getStorageSync("auth_logged_in");
  if (!logged) {
    active.value = false;
    return false;
  }
  try {
    const devices = await deviceApi.getCalendarDeviceList();
    const current = (devices || []).find((item) => String(item.deviceEmail || "").trim() === email);
    active.value = !!(current && Number(current.status) === 1);
    if (current && current.deviceName) calendarName.value = String(current.deviceName);
    return true;
  } catch (e) {
    active.value = false;
    return false;
  }
}

function avatarStyle(color) {
  return { background: String(color || "#4cc38a") };
}

function rgbaFromColor(color, alpha) {
  const c = String(color || "").trim();
  if (!c) return `rgba(61, 106, 251, ${alpha})`;
  if (c.startsWith("rgba(")) {
    const inner = c.slice(5, -1);
    const parts = inner.split(",").map((x) => x.trim());
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    return c;
  }
  if (c.startsWith("rgb(")) {
    const inner = c.slice(4, -1);
    const parts = inner.split(",").map((x) => x.trim());
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    return c;
  }
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((x) => x + x)
        .join("");
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return c;
}

function findMember(id) {
  return (memberItems.value || []).find((item) => String(item.id) === String(id || "")) || null;
}

function memberGlyph(id) {
  const member = findMember(id);
  return member && member.glyph ? member.glyph : uni.$t('我');
}

function memberColor(id) {
  const member = findMember(id);
  return member && member.color ? member.color : "#4cc38a";
}

function eventTimeText(event) {
  if (!event) return "";
  if (event.allDay) return uni.$t('全天');
  const start = String(event.startTime || "").trim();
  const end = String(event.endTime || "").trim();
  if (start && end) return `${start}-${end}`;
  return start || end || uni.$t('全天');
}

function formatHomeEventCard(event, idx) {
  const memberIds = Array.isArray(event && event.memberIds) ? event.memberIds.filter(Boolean) : [];
  const firstMemberId = memberIds[0] || "";
  const eventColorIdx = event && event.memberColor !== undefined && event.memberColor !== null ? Number(event.memberColor) : NaN;
  const directColor = Number.isFinite(eventColorIdx) ? membersApi.memberHexFromColorIndex(eventColorIdx) : "";
  const firstColor = directColor || memberColor(firstMemberId);
  return {
    id: event && event.id ? String(event.id) : `ev_${idx}`,
    title: event && event.title ? String(event.title) : "",
    timeText: eventTimeText(event),
    cls: "",
    bg: memberIds.length > 1 ? "rgba(255, 255, 255, 0.88)" : rgbaFromColor(firstColor, 0.14),
    right:
      memberIds.length > 1
        ? {
            type: "group",
            avatars: memberIds.slice(0, 4).map((id) => ({
              glyph: memberGlyph(id),
              color: memberColor(id),
            })),
          }
        : {
            type: "single",
            glyph: memberGlyph(firstMemberId),
            color: firstColor,
          },
  };
}

function refreshLocalFallback() {
  const today = todayKey();
  const calendarState = ensureCalendarState();
  const taskState = ensureTaskState();
  const localMembers = listMembers(calendarState).filter((item) => item.enabled !== false);
  const localEvents = eventsForDate(calendarState, today);
  const localTasks = tasksForDate(taskState, today, { memberId: "all" });
  memberItems.value = localMembers;
  todayEventsRaw.value = localEvents;
  homeStats.value = {
    calendarCount: Math.min(localEvents.length, HOME_EVENT_PREVIEW_LIMIT),
    taskPendingCount: localTasks.filter((item) => !isTaskDone(item)).length,
    listCount: 0,
    galleryFileCount: 0,
    memberCount: localMembers.length,
  };
}

async function refreshHomeData() {
  loadContext();
  await syncDeviceActivationStatus();
  const email = await ensureCalendarEmail();
  const logged = !!uni.getStorageSync("auth_logged_in");
  if (!logged || !email) {
    refreshLocalFallback();
    return;
  }
  const { today, startDate, endDate } = homeEventQueryRange();
  const [memberRes, matterRes, taskRes, listRes, albumRes] = await Promise.allSettled([
    membersApi.getMemberList({ deviceEmail: email }),
    calendarApi.getMatterInfoList({ deviceEmail: email, startDate, endDate }),
    tasksApi.getTaskInfoList({ deviceEmail: email, startDate: today, endDate: today }),
    tasksApi.getItemTypeList({ deviceEmail: email }),
    getAlbumList({ deviceEmail: email }),
  ]);

  const nextMembers =
    memberRes.status === "fulfilled" ? membersApi.mapRemoteMembersToLocalMembers(memberRes.value) : [];
  memberItems.value = nextMembers;

  const nextEvents =
    matterRes.status === "fulfilled"
      ? calendarApi
          .mapRemoteMattersToLocalEvents(matterRes.value)
          .filter((item) => String(item && item.startDate ? item.startDate : "") === today)
      : [];
  todayEventsRaw.value = nextEvents
    .slice()
    .sort((a, b) => String(a.startTime || "99:99").localeCompare(String(b.startTime || "99:99")));

  const nextTasks = taskRes.status === "fulfilled" ? taskRes.value : [];
  const nextLists = listRes.status === "fulfilled" ? listRes.value : [];
  const nextAlbums = albumRes.status === "fulfilled" ? albumRes.value : [];
  const galleryFileCount = nextAlbums.reduce((sum, album) => {
    const total = Number(album && album.total !== undefined ? album.total : Array.isArray(album?.photos) ? album.photos.length : 0);
    return sum + (Number.isFinite(total) ? total : 0);
  }, 0);

  homeStats.value = {
    calendarCount: Math.min(nextEvents.length, HOME_EVENT_PREVIEW_LIMIT),
    taskPendingCount: nextTasks.filter((item) => !isTaskDone(item)).length,
    listCount: nextLists.length,
    galleryFileCount,
    memberCount: nextMembers.length,
  };
}

onLoad(() => {
  loadContext();
  refreshHomeData();
});

onShow(() => {
  refreshHomeData();
});

function open(title) {
  if (title === uni.$t('日历')) {
    uni.navigateTo({ url: "/pages/calendar/index" });
    return;
  }
  if (title === uni.$t('任务')) {
    uni.navigateTo({ url: "/pages/tasks/index" });
    return;
  }
  if (title === uni.$t('奖励')) {
    uni.navigateTo({ url: "/pages/rewards/index" });
    return;
  }
  if (title === uni.$t('清单')) {
    uni.navigateTo({ url: "/pages/lists/index" });
    return;
  }
  if (title === uni.$t('餐食')) {
    uni.navigateTo({ url: "/pages/meals/index" });
    return;
  }
  if (title === uni.$t('同步')) {
    uni.navigateTo({ url: "/pages/sync/sync-home" });
    return;
  }
  if (title === uni.$t('成员管理')) {
    uni.navigateTo({ url: "/pages/members/index" });
    return;
  }
  if (title === uni.$t('设备管理')) {
    uni.navigateTo({ url: "/pages/me/device" });
    return;
  }
  if (title === uni.$t('用户管理')) {
    uni.navigateTo({ url: "/pages/users/index" });
    return;
  }
  if (title === uni.$t('相册')) {
    uni.navigateTo({ url: "/pages/gallery/index" });
    return;
  }
  if (title === uni.$t('通知')) {
    uni.navigateTo({
      url: `/pages/me/notice?deviceName=${encodeURIComponent(String(calendarName.value || ""))}&deviceEmail=${encodeURIComponent(String(calendarEmail.value || ""))}`,
    });
    return;
  }
  if (title === uni.$t('贺卡')) {
    uni.navigateTo({ url: "/pages/cards/index" });
    return;
  }
  uni.showToast({ title, icon: "none" });
}

function goActivate() {
  uni.navigateTo({ url: "/pages/device/activate" });
}
</script>

<style scoped lang="scss">
.bl-page {
  background: #ffffff;
}

.center {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.mini-icon {
  width: 34rpx;
  height: 24rpx;
  border-radius: 6rpx;
  background: linear-gradient(135deg, #ffd24d 0%, #3d6afb 100%);
}

.title {
  font-size: 34rpx;
  font-weight: 900;
}

.top-card {
  margin-top: 0;
}

.device-card {
  position: relative;
  background: linear-gradient(180deg, #dee9ff 0%, #fafafa 100%);
  border: 4rpx solid rgba(64,109,255,0.2);
  border-radius: 22rpx;
  box-shadow: none;
  padding: 18rpx 18rpx;
}

.thumb {
  width: 110rpx;
  height: 82rpx;
  position: relative;
  flex-shrink: 0;
  overflow: visible;
}

.thumb-img {
  width: 100%;
  height: 100%;
}

.meta {
  margin-left: 16rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.name {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email {
  font-size: 22rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.device-card .bl-status-tag) {
  top: 18rpx;
  right: 18rpx;
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 9999rpx;
  background: #3d6afb;
  border-top-right-radius: 9999rpx;
  border-bottom-left-radius: 9999rpx;
  font-size: 22rpx;
  font-weight: 800;
}

.day-card {
  margin-top: 18rpx;
  padding: 18rpx 18rpx 16rpx;
  background: #eef4ff;
  border-radius: 20rpx;
}

.day-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12rpx;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.task-card {
  min-height: 92rpx;
  border-radius: 18rpx;
  padding: 16rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-card + .task-card {
  margin-top: 0;
}

.task-card.is-pink {
  background: #fbecef;
}

.task-card.is-green {
  background: #eaf7f1;
}

.task-card.is-gray {
  background: rgba(255, 255, 255, 0.88);
}

.task-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.task-title {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: rgba(17, 17, 17, 0.42);
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1;
}

.clock {
  width: 22rpx;
  height: 22rpx;
  display: block;
  opacity: 0.65;
}

.time-text {
  color: rgba(17, 17, 17, 0.42);
}

.avatars {
  display: flex;
  align-items: center;
  margin-left: 16rpx;
}

.bl-avatar {
  width: 42rpx;
  height: 42rpx;
  font-size: 20rpx;
  font-weight: 900;
  border: 3rpx solid #ffffff;
  box-sizing: border-box;
  box-shadow: 0 4rpx 10rpx rgba(17, 17, 17, 0.06);
}

.avatars .bl-avatar + .bl-avatar {
  margin-left: -10rpx;
}

.bl-avatar.is-blue {
  background: #4c8dff;
}

.bl-avatar.is-red {
  background: #ff5a5f;
}

.bl-avatar.is-purple {
  background: #9b59ff;
}

.bl-avatar.is-green {
  background: #4cc38a;
}

.activate-card {
  background: rgba(17, 17, 17, 0.04);
  padding-bottom: 18rpx;
}

.hero {
  height: 320rpx;
  position: relative;
}

.device-img {
  position: absolute;
  left: 50%;
  top: 10rpx;
  width: 600rpx;
  height: 300rpx;
  transform: translateX(-50%);
}

.device-plate {
  position: absolute;
  left: 50%;
  top: 120rpx;
  width: 640rpx;
  height: 260rpx;
  transform: translateX(-50%);
  background: radial-gradient(
    circle at 50% 40%,
    rgba(61, 106, 251, 0.22) 0%,
    rgba(61, 106, 251, 0) 70%
  );
  border-radius: 9999rpx;
}

.device-frame {
  position: absolute;
  left: 50%;
  top: 10rpx;
  width: 420rpx;
  height: 220rpx;
  transform: translateX(-50%) rotate(-10deg);
  border-radius: 22rpx;
  background: #111111;
  box-shadow: 0 18rpx 40rpx rgba(17, 17, 17, 0.16);
}

.device-frame::after {
  content: "";
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  right: 16rpx;
  bottom: 16rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
}

.activate-title {
  display: block;
  text-align: center;
  font-size: 30rpx;
  font-weight: 900;
  color: #3d6afb;
  margin-top: 2rpx;
}

.activate-desc {
  display: block;
  text-align: center;
  font-size: 24rpx;
  font-weight: 650;
  margin-top: 8rpx;
}

.bl-btn-primary {
  margin-top: 20rpx;
}

.arrow {
  font-size: 30rpx;
  font-weight: 900;
}

.bl-card-soft.day-empty {
  margin-top: 18rpx;
  padding: 40rpx 32rpx;
  background: url("/static/home/bg_none_activity.png") no-repeat;
  background-size: 100% 100%;
}

.empty-activity {
  height: 240rpx;
  margin-top: 22rpx;
  display: flex;
  padding: 40rpx 32rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.empty-icon {
  width: 150rpx;
  height: 180rpx;
  display: block;
}

.empty-text {
  padding-top: 12rpx;
  font-size: 20rpx;
  font-weight: 400;
}

.grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.tile {
  border-radius: 28rpx;
  padding: 28rpx;
  min-height: 154rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(17, 17, 17, 0.06);
}

.tile-icon {
  width: 108rpx;
  height: 108rpx;
  border-radius: 24rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tile-icon-img {
  width: 108rpx;
  height: 108rpx;
}

.tile-title {
  font-size: 30rpx;
  font-weight: 900;
}

.tile-sub {
  font-size: 22rpx;
  font-weight: 650;
}

.tile.is-purple {
  background:  linear-gradient(180deg, #f6f4f8 0%, #FFFFFF 100%);
}

.tile.is-blue {
  background: linear-gradient( 180deg, #eaf2ff 0%, #FFFFFF 100%);;
}

.tile.is-salmon {
  background: linear-gradient( 180deg, #fdecee 0%, #FFFFFF 100%);
}

.tile.is-green {
  background: linear-gradient( 180deg, #eaf7f1 0%, #FFFFFF 100%);
}

.tile.is-orange {
  background: linear-gradient( 180deg, #fff1e1 0%, #FFFFFF 100%);
}

.tile.is-red {
  background: linear-gradient( 180deg, #ffe8e9 0%, #FFFFFF 100%);
}

.tile.is-mint {
  background: linear-gradient( 180deg, #e8fbf4 0%, #FFFFFF 100%);
}

.tile.is-indigo {
  background: linear-gradient( 180deg, #eef2ff 0%, #FFFFFF 100%);
}

.tile.is-blue2 {
  background: linear-gradient( 180deg, #eaf2ff 0%, #FFFFFF 100%);
}

.tile.is-indigo2 {
  background: linear-gradient( 180deg, #eef2ff 0%, #FFFFFF 100%);
}

.tile.is-salmon2 {
  background: linear-gradient( 180deg, #fff0f0 0%, #FFFFFF 100%);
}

.tile.is-orange2 {
  background: linear-gradient( 180deg, #fff2e6 0%, #FFFFFF 100%);
}
</style>

<style lang="scss">
page {
  background: #ffffff !important;
}
</style>

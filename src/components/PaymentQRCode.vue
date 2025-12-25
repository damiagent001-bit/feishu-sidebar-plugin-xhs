<template>
  <el-dialog
    v-model="visible"
    title="扫码支付"
    width="320px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="payment-qr-container">
      <!-- 订单信息 -->
      <div class="order-info">
        <div class="order-item">
          <span class="label">订单号：</span>
          <span class="value">{{ orderInfo.payment_order_no }}</span>
        </div>
        <div class="order-item">
          <span class="label">支付金额：</span>
          <span class="value amount">¥{{ orderInfo.amount }}</span>
        </div>
        <div class="order-item" v-if="orderInfo.payment_expire_at">
          <span class="label">支付有效期：</span>
          <span class="value">{{ formatExpireTime(orderInfo.payment_expire_at) }}</span>
        </div>
      </div>

      <!-- 二维码 -->
      <div class="qr-code-wrapper" v-if="qrCodeImageUrl">
        <div class="qr-code-container">
          <img :src="qrCodeImageUrl" alt="支付二维码" class="qr-code-image" @error="handleQRCodeError" />
        </div>
        <p class="qr-tip">请使用支付宝扫码支付</p>
      </div>

      <!-- 加载状态 -->
      <div class="loading-container" v-else>
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 支付状态提示 -->
      <div class="payment-status" v-if="paymentStatus">
        <el-alert
          :type="paymentStatus === 'success' ? 'success' : 'info'"
          :closable="false"
          show-icon
        >
          <template #title>
            <span v-if="paymentStatus === 'success'">支付成功！</span>
            <span v-else>等待支付中...</span>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleCheckPayment" :loading="checking">
          我已支付
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { API_CONFIG, API_ENDPOINTS } from '../config.js';
import { bitable } from '@lark-base-open/js-sdk';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  orderInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'payment-success', 'close']);

const visible = ref(false);
const checking = ref(false);
const paymentStatus = ref(''); // 'success', 'pending'
const qrCodeImageUrl = ref('');
let pollTimer = null;

// 将支付宝短链接转换为二维码图片URL
const convertToQRCodeImage = (url) => {
  if (!url) return '';
  
  // 支付宝返回的是短链接，需要转换为二维码图片
  // 使用第三方服务将URL转换为二维码图片
  // 这里使用 qr-server.com 服务（免费、无需API密钥）
  const encodedUrl = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
};

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.orderInfo.order_id) {
    // 支付宝返回的 qr_code_url 是短链接，需要转换为二维码图片
    const qrCodeUrl = props.orderInfo.qr_code_url || props.orderInfo.payment_url;
    if (qrCodeUrl) {
      console.log('支付宝二维码URL:', qrCodeUrl);
      qrCodeImageUrl.value = convertToQRCodeImage(qrCodeUrl);
    } else {
      console.warn('订单信息中没有二维码URL:', props.orderInfo);
    }
    startPolling();
  } else {
    stopPolling();
    qrCodeImageUrl.value = '';
  }
});

// 监听 orderInfo 变化，更新二维码
watch(() => props.orderInfo, (newInfo) => {
  if (newInfo && (newInfo.qr_code_url || newInfo.payment_url)) {
    const qrCodeUrl = newInfo.qr_code_url || newInfo.payment_url;
    console.log('订单信息更新，支付宝二维码URL:', qrCodeUrl);
    qrCodeImageUrl.value = convertToQRCodeImage(qrCodeUrl);
  }
}, { deep: true, immediate: true });

watch(visible, (val) => {
  if (!val) {
    stopPolling();
  }
});

// 开始轮询支付状态
const startPolling = () => {
  if (!props.orderInfo.order_id) return;
  
  paymentStatus.value = 'pending';
  let pollCount = 0;
  const maxPolls = 120; // 最多轮询2分钟（每1秒一次）
  
  pollTimer = setInterval(async () => {
    pollCount++;
    if (pollCount > maxPolls) {
      stopPolling();
      return;
    }
    
    try {
      const paid = await checkPaymentStatus(props.orderInfo.order_id);
      if (paid) {
        paymentStatus.value = 'success';
        stopPolling();
        ElMessage.success('支付成功！');
        emit('payment-success', props.orderInfo);
        // 2秒后自动关闭
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('轮询支付状态失败:', error);
    }
  }, 1000);
};

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

// 检查支付状态
const checkPaymentStatus = async (orderId) => {
  try {
    const feishuUserId = await bitable.bridge.getBaseUserId();
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.pollOrder(orderId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Feishu-User-ID': feishuUserId,
      },
    });

    const result = await response.json();
    return result.code === 0 && result.data && result.data.paid === true;
  } catch (error) {
    console.error('检查支付状态失败:', error);
    return false;
  }
};

// 手动检查支付
const handleCheckPayment = async () => {
  checking.value = true;
  try {
    const paid = await checkPaymentStatus(props.orderInfo.order_id);
    if (paid) {
      paymentStatus.value = 'success';
      ElMessage.success('支付成功！');
      emit('payment-success', props.orderInfo);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      ElMessage.info('支付尚未完成，请稍后再试');
    }
  } catch (error) {
    ElMessage.error('检查支付状态失败，请稍后重试');
  } finally {
    checking.value = false;
  }
};

// 格式化过期时间
const formatExpireTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    const minutes = Math.floor((date - new Date()) / 1000 / 60);
    if (minutes <= 0) return '已过期';
    return `${minutes}分钟后`;
  } catch (e) {
    return '';
  }
};

// 二维码加载错误处理
const handleQRCodeError = (event) => {
  console.error('二维码图片加载失败:', event);
  ElMessage.error('二维码加载失败，请刷新页面重试');
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
  emit('update:modelValue', false);
  emit('close');
  qrCodeImageUrl.value = '';
};

onMounted(() => {
  visible.value = props.modelValue;
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.payment-qr-container {
  padding: 20px 0;
}

.order-info {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.order-item .label {
  color: #606266;
}

.order-item .value {
  color: #303133;
  font-weight: 500;
}

.order-item .value.amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.qr-code-wrapper {
  text-align: center;
  margin-bottom: 24px;
}

.qr-code-container {
  display: inline-block;
  padding: 8px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  display: block;
}

.qr-tip {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.loading-container {
  padding: 40px 20px;
  text-align: center;
}

.payment-status {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>


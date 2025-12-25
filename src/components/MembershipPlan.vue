<template>
  <div class="membership-plan-container">
    <!-- 头部 -->
    <div class="plan-header">
      <div class="header-left" @click="handleBack">
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </div>
      <div class="header-center">
        <div class="header-title">小红书博主关键词批量查询</div>
        <div class="header-subtitle">套餐</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 套餐卡片列表 -->
    <div class="plans-container" v-else>
      <div
        v-for="plan in paidPlans"
        :key="plan.code"
        :class="['plan-card', { featured: plan.is_recommended }]"
      >
        <div class="plan-title">{{ plan.name }}</div>
        
        <!-- 功能列表 -->
        <div class="plan-features">
          <div
            v-for="(benefit, index) in getFilteredBenefits(plan.benefits)"
            :key="index"
            class="feature-item"
          >
            <span :class="['feature-icon', benefit.status === 1 ? 'check' : 'cross']">
              {{ benefit.status === 1 ? '✓' : '✗' }}
            </span>
            <span class="feature-text" v-html="formatBenefitText(benefit.description, plan.monthly_smart_points)"></span>
          </div>
        </div>

        <!-- 适合人群 -->
        <div class="plan-suitable" v-if="plan.suitable_for">
          {{ plan.suitable_for }}
        </div>

        <!-- 价格信息 -->
        <div class="plan-price">
          <span v-if="plan.original_price" class="original-price">
            原价:{{ formatPrice(plan.original_price) }}{{ getPriceUnit(plan.payment_type) }}
          </span>
          <div v-if="plan.price" class="current-price">
            <span class="price-amount highlight-red">
              {{ formatPrice(plan.price) }}{{ getPriceUnit(plan.payment_type) }}
            </span>
            <span v-if="shouldShowSpecialOffer(plan)" class="price-tag">限时特惠</span>
          </div>
          <span v-else class="price-amount">免费</span>
        </div>

        <!-- 操作按钮 -->
        <el-button
          class="plan-button"
          :type="plan.is_free ? 'info' : 'danger'"
          :disabled="isCurrentPlan(plan) || creatingOrder"
          :loading="creatingOrder"
          @click="handlePurchase(plan)"
        >
          {{ creatingOrder ? '创建订单中...' : getButtonText(plan) }}
        </el-button>
      </div>
    </div>

    <!-- 支付二维码弹窗 -->
    <PaymentQRCode
      v-model="showPaymentQR"
      :order-info="orderInfo"
      @payment-success="handlePaymentSuccess"
      @close="handleClosePaymentQR"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { bitable } from '@lark-base-open/js-sdk';
import { API_CONFIG, API_ENDPOINTS } from '../config.js';
import PaymentQRCode from './PaymentQRCode.vue';

const props = defineProps({
  currentPlan: {
    type: String,
    default: 'free', // 'free', 'member', 'super'
  },
  platform: {
    type: String,
    default: 'douyin', // 'douyin' 或 'xiaohongshu'
  },
});

const emit = defineEmits(['close', 'purchase']);

const loading = ref(false);
const plans = ref([]);
const showPaymentQR = ref(false);
const orderInfo = ref({});
const creatingOrder = ref(false);

// 过滤掉免费版，只显示付费套餐
const paidPlans = computed(() => {
  return plans.value.filter(plan => !plan.is_free);
});

// 根据平台获取服务编码
const getServiceCode = (platform) => {
  return platform === 'xiaohongshu' ? 'sidebar_xiaohongshu' : 'sidebar_douyin';
};

// 获取套餐列表
const fetchPlans = async () => {
  loading.value = true;
  try {
    const serviceCode = getServiceCode(props.platform);
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.getPricingPlans(serviceCode)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.code === 0 && result.data) {
      plans.value = result.data;
    } else {
      ElMessage.error(result.msg || '获取套餐列表失败');
    }
  } catch (error) {
    console.error('获取套餐列表失败:', error);
    ElMessage.error('获取套餐列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '0';
  return parseFloat(price).toFixed(0);
};

// 获取价格单位
const getPriceUnit = (paymentType) => {
  if (!paymentType) return '';
  return paymentType === 'annual' ? '元/年' : '元/季';
};

// 过滤掉包含"不支持定时同步"的benefit项
const getFilteredBenefits = (benefits) => {
  if (!benefits || !Array.isArray(benefits)) return [];
  return benefits.filter(benefit => {
    if (!benefit.description) return true;
    return !benefit.description.includes('不支持定时同步');
  });
};

// 判断是否显示"限时特惠"标签（小红书：158元/季显示）
const shouldShowSpecialOffer = (plan) => {
  if (!plan.price) return false;
  const price = parseFloat(plan.price);
  const paymentType = plan.payment_type;
  
  // 季付且价格为158元时显示
  if (paymentType !== 'annual' && price === 158) {
    return true;
  }
  
  return false;
};

// 格式化功能描述文本（高亮数字）
const formatBenefitText = (text, monthlyPoints) => {
  if (!text) return '';
  // 如果文本中包含数字，尝试高亮显示
  return text.replace(/(\d+)/g, '<span class="highlight-red">$1</span>');
};

// 判断是否为当前套餐
const isCurrentPlan = (plan) => {
  if (plan.is_free && props.currentPlan === 'free') {
    return true;
  }
  // 可以根据 plan.code 或其他标识来判断
  return false;
};

// 获取按钮文本
const getButtonText = (plan) => {
  if (plan.is_free) {
    return isCurrentPlan(plan) ? '当前版本' : '免费';
  }
  return isCurrentPlan(plan) ? '当前版本' : '立即购买';
};

// 当前套餐名称（如果当前是免费版，显示免费版；否则从付费套餐中查找）
const currentPlanName = computed(() => {
  if (props.currentPlan === 'free') {
    return '免费版';
  }
  // 可以根据其他逻辑判断当前付费套餐
  return '免费版';
});

const handleBack = () => {
  emit('close');
};

// 创建订单
const createOrder = async (plan) => {
  if (!plan.plan_id || !plan.service_id) {
    ElMessage.error('套餐信息不完整，无法创建订单');
    return;
  }

  creatingOrder.value = true;
  try {
    // 获取飞书用户ID
    const feishuUserId = await bitable.bridge.getBaseUserId();
    
    // 调用创建订单接口
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.createOrder()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Feishu-User-ID': feishuUserId,
      },
      body: JSON.stringify({
        service_id: plan.service_id,
        pricing_plan_id: plan.plan_id,
        payment_method: 'alipay', // 目前只支持支付宝
      }),
    });

    const result = await response.json();
    
    if (result.code === 0 && result.data) {
      console.log('订单创建成功，订单信息:', result.data);
      orderInfo.value = result.data;
      showPaymentQR.value = true;
      ElMessage.success('订单创建成功，请扫码支付');
    } else {
      console.error('创建订单失败:', result);
      ElMessage.error(result.msg || '创建订单失败，请稍后重试');
    }
  } catch (error) {
    console.error('创建订单失败:', error);
    ElMessage.error('创建订单失败，请稍后重试');
  } finally {
    creatingOrder.value = false;
  }
};

const handlePurchase = (plan) => {
  if (plan.is_free) {
    return;
  }
  // 创建订单并显示支付二维码
  createOrder(plan);
};

// 支付成功回调
const handlePaymentSuccess = (order) => {
  emit('purchase', order);
  ElMessage.success('支付成功！');
};

// 关闭支付二维码弹窗
const handleClosePaymentQR = () => {
  showPaymentQR.value = false;
  orderInfo.value = {};
};

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
.membership-plan-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.plan-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.back-icon {
  font-size: 18px;
  font-weight: bold;
}

.back-text {
  font-size: 14px;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.header-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

.current-status {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 20px;
}

.status-text {
  font-size: 14px;
  color: #333;
}

.loading-container {
  padding: 20px;
}

.plans-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px 20px;
}

.plan-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.plan-card.featured {
  border: 2px solid #ff4d4f;
}

.plan-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.plan-features {
  margin-bottom: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.feature-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.feature-icon.check {
  color: #52c41a;
  font-weight: bold;
}

.feature-icon.cross {
  color: #ff4d4f;
  font-weight: bold;
}

.feature-text {
  flex: 1;
  line-height: 20px;
}

.highlight-red {
  color: #ff4d4f;
  font-weight: 500;
}

.plan-suitable {
  font-size: 12px;
  color: #666;
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.plan-price {
  margin-bottom: 20px;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
  display: block;
  margin-bottom: 8px;
}

.current-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ff4d4f;
}

.price-tag {
  font-size: 12px;
  color: #ff4d4f;
  background-color: #fff1f0;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #ffccc7;
}

.plan-button {
  width: 100%;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
}
</style>

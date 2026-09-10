"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield } from "lucide-react";

const termsOfServiceContent = `
## 服务条款

**最后更新日期：2026年9月6日**

### 1. 服务说明

本平台（以下简称"我们"）提供AI虚拟伴侣聊天服务。通过使用我们的服务，您同意遵守以下条款。

### 2. 用户账户

2.1 **注册要求**
- 您必须拥有有效的电子邮箱地址
- 您必须年满18周岁或在父母/监护人的同意下使用本服务
- 您对账户的安全性负全部责任

2.2 **账户安全**
- 请妥善保管您的登录凭证
- 如发现账户被未经授权访问，请立即通知我们
- 我们不对因您未能保护账户信息而造成的损失负责

### 3. 可接受的使用政策

3.1 **允许的行为**
- 使用服务进行个人娱乐和交流
- 创建和定制虚拟角色
- 分享适当的对话内容

3.2 **禁止的行为**
- 使用服务进行非法活动
- 骚扰、威胁或欺凌其他用户
- 尝试破坏或干扰服务的正常运行
- 上传恶意软件或有害代码
- 未经授权收集其他用户的信息
- 复制、修改或分发受版权保护的内容

### 4. 知识产权

4.1 **平台内容**
- 平台的设计、文本、图形和其他内容受版权保护
- 未经书面许可，不得复制或修改

4.2 **用户生成内容**
- 您保留对您创建内容的所有权
- 授予我们在提供服务所需的范围内使用您内容的许可
- 您保证您的内容不侵犯他人的权利

### 5. 付费服务

5.1 **定价**
- 我们可能提供免费和付费服务
- 价格可能会变更，变更前会提前通知
- 所有费用均以显示的货币结算

5.2 **退款政策**
- 具体退款政策取决于服务类型
- 如需退款，请联系客服团队

### 6. 责任限制

6.1 **服务按"原样"提供**
- 我们不保证服务不间断或无错误
- 我们不对因使用或无法使用服务而造成的间接损失负责

6.2 **责任上限**
- 我们的累计责任不超过您在过去12个月内支付的费用

### 7. 终止

7.1 **用户终止**
- 您可以随时停止使用服务
- 删除账户后，您的数据将按照隐私政策处理

7.2 **平台终止**
- 我们可能在以下情况下终止或暂停您的账户：
  - 违反这些条款
  - 长期未活跃
  - 法律要求

### 8. 条款变更

我们可能随时更新这些条款。重大变更将通过：
- 平台内通知
- 电子邮件通知（如适用）
- 在此页面更新"最后更新日期"

继续使用服务即表示您接受更新后的条款。

### 9. 联系我们

如有疑问，请通过以下方式联系：
- 邮箱：support@example.com
- 客服工作时间：周一至周五 9:00-18:00
`;

const privacyPolicyContent = `
## 隐私政策

**最后更新日期：2026年9月6日**

### 1. 引言

我们重视您的隐私。本隐私政策说明了当我们为您提供AI虚拟伴侣服务时，如何收集、使用和保护您的个人信息。

### 2. 信息收集

2.1 **我们收集的信息类型**

**账户信息**
- 电子邮箱地址
- 登录记录和时间戳
- 设备信息（操作系统、浏览器类型）

**使用数据**
- 与虚拟角色的对话历史
- 您的偏好设置
- 功能使用统计
- 错误日志

**支付信息**（如适用）
- 支付方式信息（由第三方处理商安全处理）
- 交易记录

2.2 **信息收集方式**
- 当您注册和使用服务时直接收集
- 通过Cookie和类似技术自动收集
- 从第三方服务（分析工具）间接收集

### 3. 信息使用

3.1 **我们如何使用您的信息**

**核心服务提供**
- 创建和管理您的账户
- 提供个性化体验
- 保存对话历史
- 处理支付交易

**服务改进**
- 分析使用模式以改进服务
- 测试新功能和性能
- 修复错误和技术问题

**安全保障**
- 检测和防止欺诈活动
- 保护账户安全
- 遵守法律义务

**沟通**
- 发送服务相关通知
- 回应您的询问和请求
- 发送营销信息（您可随时退订）

### 4. 信息共享

4.1 **我们不会出售您的个人信息**

4.2 **有限的信息共享场景**

**服务提供商**
- 云存储服务商（存储对话数据）
- 支付处理商（处理交易）
- 分析工具提供商（匿名统计数据）

**法律要求**
- 遵守法院命令或法律程序
- 保护 ourselves、用户或公众的权利和安全
- 配合政府调查

**业务转让**
- 如发生合并、收购或资产转让
- 我们会确保接收方继续保护您的信息

### 5. 数据安全

5.1 **安全措施**
- SSL/TLS加密传输数据
- 加密存储敏感信息
- 定期安全审计
- 访问控制和监控
- 员工隐私培训

5.2 **数据保留**
- 账户期间：持续保存
- 账户删除后：30天内永久删除
- 法律要求：依法保留必要时间

### 6. 您的权利

6.1 **访问权**
- 查看我们持有的关于您的信息
- 下载您的数据副本

6.2 **更正权**
- 更正不准确的信息
- 更新过时的信息

6.3 **删除权**
- 请求删除您的账户和数据
- 某些法定例外情况除外

6.4 **可携带权**
- 以机器可读格式导出您的数据
- 传输到其他服务提供商

6.5 **反对权**
- 反对某些数据处理活动
- 退出营销通信

6.6 **行使权利**
- 通过账户设置自行操作
- 联系privacy@example.com

### 7. Cookie和追踪技术

7.1 **使用的Cookie类型**

**必需Cookie**
- 维持您的登录状态
- 记住您的偏好设置
- 无法关闭

**分析Cookie**
- 匿名统计使用情况
- 改进用户体验
- 可以拒绝

**营销Cookie**
- 提供相关广告
- 追踪广告效果
- 可以拒绝

7.2 **管理Cookie**
- 通过浏览器设置管理
- 使用我们的Cookie偏好工具
- 禁用可能影响某些功能

### 8. 第三方链接

我们的服务可能包含第三方网站或服务的链接。我们不对其隐私实践负责。建议您查看其隐私政策。

### 9. 儿童隐私

我们的服务不面向13岁以下儿童。如果我们发现收集了13岁以下儿童的个人信息，将立即删除。

### 10. 国际用户

如果您从欧洲经济区访问：
- 数据可能传输到其他国家
- 我们确保适当的保护措施（标准合同条款等）
- 您享有GDPR规定的权利

### 11. 政策更新

我们可能不时更新本政策。我们将：
- 在此页面发布更新版本
- 通知重大变更
- 更新"最后生效日期"

继续使用即表示您接受更新后的政策。

### 12. 联系我们

如有隐私相关问题：
- 邮箱：privacy@example.com
- 数据保护官：dpo@example.com
`;

interface LegalDocumentsProps {
  type: "terms" | "privacy";
}

export default function LegalDocuments({ type }: LegalDocumentsProps) {
  const isTerms = type === "terms";
  const title = isTerms ? "服务条款" : "隐私政策";
  const content = isTerms ? termsOfServiceContent : privacyPolicyContent;
  const Icon = isTerms ? FileText : Shield;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <a
          href="#"
          className="underline hover:text-[#3D2C2E] transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          {title}
        </a>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-white/95 backdrop-blur-xl border border-[#EDE5E0]/50 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-[#EDE5E0]/30">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-[#3D2C2E]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#F8C8D4]/20 to-[#FFB6C1]/20">
              <Icon className="w-5 h-5 text-[#F8C8D4]" />
            </div>
            {title}
            <span className="text-xs font-normal text-[#9B8A8E] ml-auto">
              最后更新：2026-09-06
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
          <div className="prose prose-sm max-w-none text-[#3D2C2E]">
            <div className="whitespace-pre-wrap leading-relaxed text-sm">
              {content.split("\n").map((line, index) => {
                if (line.startsWith("## ")) {
                  return (
                    <h2
                      key={index}
                      className="text-lg font-bold text-[#3D2C2E] mt-6 mb-3 first:mt-0"
                    >
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3
                      key={index}
                      className="text-base font-semibold text-[#3D2C2E] mt-4 mb-2"
                    >
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <p
                      key={index}
                      className="font-semibold text-[#3D2C2E] mt-3 mb-1"
                    >
                      {line.replace(/\*\*/g, "")}
                    </p>
                  );
                }
                if (line.trim() === "") {
                  return <div key={index} className="h-2" />;
                }
                return (
                  <p key={index} className="text-[#5A4A4E] mb-1 pl-4">
                    {line}
                  </p>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-[#F8C8D4]/10 to-[#FFB6C1]/10 border border-[#F8C8D4]/20">
              <p className="text-xs text-[#9B8A8E] text-center font-medium">
                继续使用我们的服务即表示您已阅读并同意上述{title}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

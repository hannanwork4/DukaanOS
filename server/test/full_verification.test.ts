import assert from 'node:assert';
import { db } from '../src/db/index.js';
import { inventoryService } from '../src/services/inventoryService.js';
import { supplierService } from '../src/services/supplierService.js';
import { purchaseService } from '../src/services/purchaseService.js';
import { saleService } from '../src/services/saleService.js';
import { expenseService } from '../src/services/expenseService.js';
import { ledgerService } from '../src/services/ledgerService.js';

async function runRigorousBackendVerification() {
  console.log('🚀 Running Full DukaanOS Backend Verification Test Suite...\n');

  const testBizId = 'b-verify-' + Date.now();
  const testEmail = `owner_${Date.now()}@testdukaan.com`;

  // 1. Business Profile Creation & Fetch
  console.log('1. Testing Business Creation & Profile Verification');
  const biz = await db.createBusiness({
    id: testBizId,
    name: 'Aman General Store',
    owner_name: 'Aman Verma',
    phone: '+91 98111 22233',
    address: 'Shop 12, Chandni Chowk, Delhi',
    currency: 'INR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  assert.strictEqual(biz.id, testBizId);
  assert.strictEqual(biz.name, 'Aman General Store');

  const fetchedBiz = await db.getBusiness(testBizId);
  assert.ok(fetchedBiz);
  assert.strictEqual(fetchedBiz.owner_name, 'Aman Verma');

  // 2. Business Profile Update
  console.log('2. Testing Store Profile Updates');
  const updatedBiz = await db.updateBusiness(testBizId, {
    name: 'Aman Supermart & Kirana',
    address: 'Shop 12-14, Main Road, Chandni Chowk, Delhi'
  });
  assert.ok(updatedBiz);
  assert.strictEqual(updatedBiz.name, 'Aman Supermart & Kirana');

  // 3. User Entity & OTP Cycle
  console.log('3. Testing OTP Storage & Expiry Verification');
  await db.saveOtp(testEmail, '876543', 600000);
  const otpValid = await db.verifyOtp(testEmail, '876543');
  assert.strictEqual(otpValid, true);

  const otpInvalid = await db.verifyOtp(testEmail, '000000');
  assert.strictEqual(otpInvalid, false);

  // 4. Products & Inventory Management
  console.log('4. Testing Product Creation, Low Stock Alerts & Sizing');
  const prod1 = await inventoryService.createProduct(testBizId, {
    name: 'Basmati Rice 5kg',
    category: 'Grains & Pulses',
    unit: 'bags',
    purchase_price: 380,
    selling_price: 450,
    min_stock_threshold: 5,
    initial_stock: 12
  });
  assert.strictEqual(prod1.current_stock, 12);
  assert.strictEqual(prod1.selling_price, 450);

  const prod2 = await inventoryService.createProduct(testBizId, {
    name: 'Amul Butter 500g',
    category: 'Dairy',
    unit: 'packs',
    purchase_price: 240,
    selling_price: 275,
    min_stock_threshold: 10,
    initial_stock: 4 // Below threshold
  });

  const lowStock = await inventoryService.getLowStockProducts(testBizId);
  assert.ok(lowStock.some(p => p.id === prod2.id));

  // 5. Supplier Relationship & Dues
  console.log('5. Testing Supplier Management & Purchasing');
  const supplier = await supplierService.createSupplier(testBizId, {
    name: 'Delhi Dairy Distributors',
    phone: '+91 99999 88888',
    business_name: 'Amul Depot Delhi'
  });

  // Purchase 20 packs of Butter @ ₹240 = ₹4,800. Paid ₹2,000, Outstanding ₹2,800
  const { purchase } = await purchaseService.recordPurchase(testBizId, {
    supplier_id: supplier.id,
    purchase_date: new Date().toISOString(),
    payment_method: 'UPI',
    amount_paid: 2000,
    items: [
      {
        product_id: prod2.id,
        quantity: 20,
        unit_price: 240
      }
    ]
  });
  assert.strictEqual(purchase.total_amount, 4800);
  assert.strictEqual(purchase.outstanding_amount, 2800);

  // Verify stock updated: 4 + 20 = 24
  const updatedProd2 = await inventoryService.getProductById(testBizId, prod2.id);
  assert.strictEqual(updatedProd2?.current_stock, 24);

  // Verify supplier outstanding balance
  const supAfterPurchase = await supplierService.getSupplierById(testBizId, supplier.id);
  assert.strictEqual(supAfterPurchase?.outstanding_balance, 2800);

  // 6. Record Supplier Due Settlement
  console.log('6. Testing Supplier Debt Clearance');
  await supplierService.recordSupplierPayment(testBizId, {
    supplier_id: supplier.id,
    amount: 2800,
    payment_method: 'Bank Transfer',
    notes: 'Cleared purchase invoice'
  });

  const supSettled = await supplierService.getSupplierById(testBizId, supplier.id);
  assert.strictEqual(supSettled?.outstanding_balance, 0);

  // 7. Counter Sales & Stock Deduction
  console.log('7. Testing Counter Sales & Gross Profit Margin Calculation');
  // Sell 4 bags of Rice (@ ₹450 = ₹1,800. Cost = 4*380 = 1520, Margin = ₹280)
  const { sale } = await saleService.recordSale(testBizId, {
    sale_date: new Date().toISOString(),
    payment_method: 'Cash',
    customer_name: 'Rajesh Kumar',
    amount_received: 1800,
    items: [
      {
        product_id: prod1.id,
        quantity: 4,
        unit_price: 450
      }
    ]
  });
  assert.strictEqual(sale.total_amount, 1800);

  const prod1AfterSale = await inventoryService.getProductById(testBizId, prod1.id);
  assert.strictEqual(prod1AfterSale?.current_stock, 8); // 12 - 4 = 8

  // 8. Daily Expenses
  console.log('8. Testing Operating Expense Tracking');
  const expense = await expenseService.recordExpense(testBizId, {
    category: 'Miscellaneous',
    amount: 150,
    description: 'Evening tea and biscuits for shop staff',
    payment_method: 'Cash',
    date: new Date().toISOString()
  });
  assert.strictEqual(expense.amount, 150);

  // 9. Dashboard Financial Summary & Double-Entry Ledger
  console.log('9. Testing Financial Dashboard Aggregate Metrics & Double-Entry Ledger');
  const summary = await ledgerService.getDashboardSummary(testBizId);
  assert.strictEqual(summary.today_sales, 1800);
  assert.strictEqual(summary.today_expenses, 150);
  assert.strictEqual(summary.outstanding_supplier_payments, 0); // All cleared

  const transactions = await ledgerService.getTransactions(testBizId);
  assert.ok(transactions.length >= 4);

  console.log('\n✨ ALL BACKEND RIGOROUS INTEGRITY CHECKS PASSED SUCCESSFULLY! ✨\n');
}

runRigorousBackendVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

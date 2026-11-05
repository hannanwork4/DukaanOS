import assert from 'node:assert';
import { inventoryService } from '../src/services/inventoryService.js';
import { supplierService } from '../src/services/supplierService.js';
import { purchaseService } from '../src/services/purchaseService.js';
import { saleService } from '../src/services/saleService.js';
import { expenseService } from '../src/services/expenseService.js';
import { ledgerService } from '../src/services/ledgerService.js';
import { db } from '../src/db/index.js';

const TEST_BIZ = 'b-test-' + Date.now();

async function runTests() {
  console.log('🧪 Starting DukaanOS Business Logic & Integrity Tests...\n');

  // Test 0: Seed test business
  console.log('0. Initializing test business');
  await db.createBusiness({
    id: TEST_BIZ,
    name: 'Test Kirana',
    currency: 'INR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Test 1: Create a product
  console.log('1. Creating product: Tata Tea Gold 250g');
  const product = await inventoryService.createProduct(TEST_BIZ, {
    name: 'Tata Tea Gold 250g',
    category: 'Beverages',
    unit: 'packets',
    purchase_price: 110,
    selling_price: 135,
    min_stock_threshold: 10,
    initial_stock: 0
  });
  assert.strictEqual(product.name, 'Tata Tea Gold 250g');
  assert.strictEqual(product.current_stock, 0);

  // Test 2: Create a supplier
  console.log('2. Creating supplier: Sharma Wholesale Agency');
  const supplier = await supplierService.createSupplier(TEST_BIZ, {
    name: 'Sharma Wholesale Agency',
    business_name: 'Sharma Agency Pvt Ltd',
    phone: '+91 98999 11111'
  });
  assert.strictEqual(supplier.name, 'Sharma Wholesale Agency');
  assert.strictEqual(supplier.outstanding_balance, 0);

  // Test 3: Record a purchase (20 packets @ ₹100 = ₹2,000. Paid ₹1,000, Pending ₹1,000)
  console.log('3. Recording purchase: 20 packets @ ₹100, Paid ₹1,000');
  const purchaseResult = await purchaseService.recordPurchase(TEST_BIZ, {
    supplier_id: supplier.id,
    items: [{
      product_id: product.id,
      quantity: 20,
      unit_price: 100
    }],
    amount_paid: 1000,
    payment_method: 'Cash',
    notes: 'Test initial stock purchase'
  });

  assert.strictEqual(purchaseResult.purchase.total_amount, 2000);
  assert.strictEqual(purchaseResult.purchase.amount_paid, 1000);
  assert.strictEqual(purchaseResult.purchase.outstanding_amount, 1000);

  // Test 4: Verify inventory increased
  console.log('4. Verifying inventory increased to 20 packets');
  const pAfterPurchase = await inventoryService.getProductById(TEST_BIZ, product.id);
  assert.strictEqual(pAfterPurchase?.current_stock, 20);
  assert.strictEqual(pAfterPurchase?.purchase_price, 100);

  // Test 5: Verify supplier balance updated
  console.log('5. Verifying supplier balance');
  const sAfterPurchase = await supplierService.getSupplierById(TEST_BIZ, supplier.id);
  assert.strictEqual(sAfterPurchase?.total_purchases, 2000);
  assert.strictEqual(sAfterPurchase?.amount_paid, 1000);
  assert.strictEqual(sAfterPurchase?.outstanding_balance, 1000);

  // Test 6 & 7: Record a supplier payment of remaining ₹1,000
  console.log('6. Recording supplier payment: ₹1,000 clearance');
  const payResult = await supplierService.recordSupplierPayment(TEST_BIZ, {
    supplier_id: supplier.id,
    amount: 1000,
    payment_method: 'UPI',
    notes: 'Clearance of pending dues'
  });
  assert.strictEqual(payResult.supplier.outstanding_balance, 0);
  assert.strictEqual(payResult.supplier.amount_paid, 2000);
  assert.strictEqual(payResult.supplier.total_purchases, 2000); // Must remain 2000! Not doubled!

  // Test 8 & 9 & 10: Record a sale: 5 packets @ ₹130 = ₹650 (UPI)
  console.log('8. Recording sale: 5 packets @ ₹130 via UPI');
  const saleResult = await saleService.recordSale(TEST_BIZ, {
    items: [{
      product_id: product.id,
      quantity: 5,
      unit_price: 130
    }],
    payment_method: 'UPI',
    customer_name: 'Anil Verma'
  });
  assert.strictEqual(saleResult.sale.total_amount, 650);
  // Cost = 5 * 100 = 500, Profit = 650 - 500 = 150
  assert.strictEqual(saleResult.profit, 150);

  console.log('9. Verifying inventory decreased: 20 - 5 = 15 packets');
  const pAfterSale = await inventoryService.getProductById(TEST_BIZ, product.id);
  assert.strictEqual(pAfterSale?.current_stock, 15);

  // Test 11 & 12: Edit the purchase (Change quantity from 20 to 25 packets @ ₹100 = ₹2500, paid ₹1500)
  console.log('11. Testing purchase edit & reversal');
  const editResult = await purchaseService.updatePurchase(TEST_BIZ, purchaseResult.purchase.id, {
    supplier_id: supplier.id,
    items: [{
      product_id: product.id,
      quantity: 25,
      unit_price: 100
    }],
    amount_paid: 1500,
    payment_method: 'Bank Transfer'
  });
  // Product stock was: 20 - 5 = 15. Reversal took off 20 => -5, then added 25 => 20!
  const pAfterEdit = await inventoryService.getProductById(TEST_BIZ, product.id);
  assert.strictEqual(pAfterEdit?.current_stock, 20);

  // Test 13: Record an expense
  console.log('13. Recording operating expense: Rent ₹5,000');
  const expense = await expenseService.recordExpense(TEST_BIZ, {
    description: 'Shop Rent November',
    category: 'Rent',
    amount: 5000,
    payment_method: 'Bank Transfer'
  });
  assert.strictEqual(expense.amount, 5000);

  // Test 14: Verify Dashboard Totals
  console.log('14. Verifying dashboard summary calculations');
  const dashboard = await ledgerService.getDashboardSummary(TEST_BIZ);
  assert.strictEqual(dashboard.today_sales, 650);
  assert.strictEqual(dashboard.today_purchases, 2500);
  assert.strictEqual(dashboard.today_expenses, 5000);
  // Inventory value: 20 packets * 100 = 2000
  assert.strictEqual(dashboard.total_inventory_value, 2000);

  // Test 15: Stock protection against negative stock
  console.log('15. Verifying stock overdraft protection');
  let overdraftFailed = false;
  try {
    await saleService.recordSale(TEST_BIZ, {
      items: [{
        product_id: product.id,
        quantity: 999, // Way more than 20
        unit_price: 130
      }]
    });
  } catch (err: any) {
    overdraftFailed = true;
    assert(err.message.includes('Insufficient stock'));
  }
  assert.strictEqual(overdraftFailed, true, 'Sale of excess stock must be prevented!');

  console.log('\n✅ ALL 15 CORE BUSINESS LOGIC TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

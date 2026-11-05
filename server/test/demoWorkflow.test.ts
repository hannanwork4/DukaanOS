import assert from 'node:assert';
import { inventoryService } from '../src/services/inventoryService.js';
import { supplierService } from '../src/services/supplierService.js';
import { purchaseService } from '../src/services/purchaseService.js';
import { saleService } from '../src/services/saleService.js';
import { ledgerService } from '../src/services/ledgerService.js';
import { db } from '../src/db/index.js';

const DEMO_BIZ = 'b-demo-' + Date.now();

async function runDemoWorkflowVerification() {
  console.log('🎬 Running Official 5-Step Volopay Demo Workflow Verification...\n');

  // Step 0: Clean business state
  await db.createBusiness({
    id: DEMO_BIZ,
    name: 'Sharma General Store',
    currency: 'INR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Step 1: Claude adds supplier "Ramesh Traders" & product "Cooking Oil"
  console.log('📌 STEP 1: Claude adds supplier & product via MCP');
  const supplier = await supplierService.createSupplier(DEMO_BIZ, {
    name: 'Ramesh Traders',
    phone: '+91 98112 34567'
  });
  console.log(`   ✓ Supplier created: ${supplier.name} (ID: ${supplier.id})`);
  assert.strictEqual(supplier.name, 'Ramesh Traders');

  const product = await inventoryService.createProduct(DEMO_BIZ, {
    name: 'Cooking Oil',
    category: 'Edible Oils',
    unit: 'packets',
    purchase_price: 100,
    selling_price: 130,
    min_stock_threshold: 5,
    initial_stock: 0
  });
  console.log(`   ✓ Product created: ${product.name} @ ₹${product.selling_price}/unit, Min Threshold: ${product.min_stock_threshold}`);
  assert.strictEqual(product.name, 'Cooking Oil');
  assert.strictEqual(product.current_stock, 0);

  // Step 2: User tells Claude: "I purchased 20 packets of Cooking Oil from Ramesh Traders for ₹2,000. I paid ₹1,000 and the remaining amount is pending."
  console.log('\n📌 STEP 2: Claude records purchase');
  const purchaseRes = await purchaseService.recordPurchase(DEMO_BIZ, {
    supplier_id: supplier.id,
    items: [{
      product_id: product.id,
      quantity: 20,
      unit_price: 100 // 20 * 100 = 2000
    }],
    amount_paid: 1000,
    payment_method: 'Cash',
    notes: '20 packets of cooking oil from Ramesh Traders'
  });
  console.log(`   ✓ Purchase recorded: ₹${purchaseRes.purchase.total_amount}, Paid: ₹${purchaseRes.purchase.amount_paid}, Pending: ₹${purchaseRes.purchase.outstanding_amount}`);

  // Step 3: Verify the app updates everything connected
  console.log('\n📌 STEP 3: Verify DukaanOS connected records');
  const pCheck1 = await inventoryService.getProductById(DEMO_BIZ, product.id);
  console.log(`   ✓ Inventory stock increased: ${pCheck1?.current_stock} packets (Expected: 20)`);
  assert.strictEqual(pCheck1?.current_stock, 20);

  const sCheck1 = await supplierService.getSupplierById(DEMO_BIZ, supplier.id);
  console.log(`   ✓ Supplier outstanding balance: ₹${sCheck1?.outstanding_balance} (Expected: 1000)`);
  assert.strictEqual(sCheck1?.outstanding_balance, 1000);
  assert.strictEqual(sCheck1?.total_purchases, 2000);
  assert.strictEqual(sCheck1?.amount_paid, 1000);

  const dashCheck1 = await ledgerService.getDashboardSummary(DEMO_BIZ);
  console.log(`   ✓ Dashboard total inventory value: ₹${dashCheck1.total_inventory_value} (Expected: 2000)`);
  assert.strictEqual(dashCheck1.total_inventory_value, 2000);

  // Step 4: Record a sale: "I sold 5 packets of Cooking Oil for ₹650 through UPI."
  console.log('\n📌 STEP 4: Claude records sale of 5 packets for ₹650 via UPI');
  const saleRes = await saleService.recordSale(DEMO_BIZ, {
    items: [{
      product_id: product.id,
      quantity: 5,
      unit_price: 130 // 5 * 130 = 650
    }],
    payment_method: 'UPI',
    notes: 'Sold 5 packets Cooking Oil'
  });
  console.log(`   ✓ Sale recorded: ₹${saleRes.sale.total_amount}, Est. Profit: ₹${saleRes.profit}`);
  assert.strictEqual(saleRes.sale.total_amount, 650);
  // Cost = 5 * 100 = 500 => Profit = 650 - 500 = 150
  assert.strictEqual(saleRes.profit, 150);

  const pCheck2 = await inventoryService.getProductById(DEMO_BIZ, product.id);
  console.log(`   ✓ Inventory decreased from 20 to: ${pCheck2?.current_stock} packets (Expected: 15)`);
  assert.strictEqual(pCheck2?.current_stock, 15);

  const dashCheck2 = await ledgerService.getDashboardSummary(DEMO_BIZ);
  console.log(`   ✓ Today's recorded sales in dashboard: ₹${dashCheck2.today_sales} (Expected: 650)`);
  assert.strictEqual(dashCheck2.today_sales, 650);

  // Step 5: Edit the record in DukaanOS and verify all connected records update
  console.log('\n📌 STEP 5: Edit the purchase in DukaanOS (increase to 25 packets @ ₹100, paid ₹1500)');
  const editRes = await purchaseService.updatePurchase(DEMO_BIZ, purchaseRes.purchase.id, {
    supplier_id: supplier.id,
    items: [{
      product_id: product.id,
      quantity: 25,
      unit_price: 100
    }],
    amount_paid: 1500,
    payment_method: 'Cash'
  });
  console.log(`   ✓ Purchase revised: ₹${editRes.purchase.total_amount}, Paid: ₹${editRes.purchase.amount_paid}`);

  const pCheck3 = await inventoryService.getProductById(DEMO_BIZ, product.id);
  // Stock was 15 (20 bought - 5 sold). New bought is 25 => 25 - 5 = 20!
  console.log(`   ✓ Recalculated stock after purchase edit: ${pCheck3?.current_stock} packets (Expected: 20)`);
  assert.strictEqual(pCheck3?.current_stock, 20);

  const sCheck2 = await supplierService.getSupplierById(DEMO_BIZ, supplier.id);
  console.log(`   ✓ Recalculated supplier balance: Outstanding ₹${sCheck2?.outstanding_balance} (Expected: 1000)`);
  assert.strictEqual(sCheck2?.total_purchases, 2500);
  assert.strictEqual(sCheck2?.amount_paid, 1500);
  assert.strictEqual(sCheck2?.outstanding_balance, 1000);

  console.log('\n🎉 ALL 5 STEPS OF THE VOLOPAY DEMO WORKFLOW PASSED WITH 100% RELIABILITY!\n');
}

runDemoWorkflowVerification().catch(err => {
  console.error('\n❌ Workflow verification failed:', err);
  process.exit(1);
});


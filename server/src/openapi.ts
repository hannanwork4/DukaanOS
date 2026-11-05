export function getOpenApiSpec(serverUrl: string = 'http://localhost:4000') {
  return {
    openapi: '3.1.0',
    info: {
      title: 'DukaanOS REST API',
      description: 'Zero-AI-Cost Store Management Engine for Kirana and Retail Stores. Connects directly to Claude via MCP.',
      version: '1.0.0'
    },
    servers: [
      {
        url: serverUrl,
        description: 'DukaanOS Local / Remote Server'
      }
    ],
    paths: {
      '/api/ledger/dashboard-summary': {
        get: {
          summary: 'Get Store Overview & Daily Financial Summary',
          operationId: 'getDashboardSummary',
          description: 'Returns today sales, purchases, expenses, supplier dues, inventory valuation, and low stock count.',
          responses: {
            '200': {
              description: 'Dashboard metrics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      today_sales: { type: 'number' },
                      today_purchases: { type: 'number' },
                      today_expenses: { type: 'number' },
                      supplier_dues: { type: 'number' },
                      total_inventory_value: { type: 'number' },
                      low_stock_count: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/products': {
        get: {
          summary: 'List Inventory Products',
          operationId: 'listProducts',
          description: 'Returns all active store products with current stock levels, safety thresholds, and selling prices.',
          responses: {
            '200': {
              description: 'List of products',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        selling_price: { type: 'number' },
                        current_stock: { type: 'number' },
                        category: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Add New Product to Inventory',
          operationId: 'addProduct',
          description: 'Registers a new product with selling price, unit, and safety threshold.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'selling_price'],
                  properties: {
                    name: { type: 'string' },
                    selling_price: { type: 'number' },
                    purchase_price: { type: 'number' },
                    unit: { type: 'string' },
                    category: { type: 'string' },
                    initial_stock: { type: 'number' },
                    min_stock_threshold: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Product created' }
          }
        }
      },
      '/api/sales': {
        get: {
          summary: 'List Recent Sales History',
          operationId: 'listSales',
          responses: {
            '200': { description: 'List of counter sales' }
          }
        },
        post: {
          summary: 'Record Customer Sale',
          operationId: 'recordSale',
          description: 'Records a counter sale, deducts stock, records gross profit, and generates a bill.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items'],
                  properties: {
                    customer_name: { type: 'string' },
                    payment_method: { type: 'string', enum: ['Cash', 'UPI', 'Credit'] },
                    amount_received: { type: 'number' },
                    notes: { type: 'string' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['product_id', 'quantity', 'unit_price'],
                        properties: {
                          product_id: { type: 'string' },
                          quantity: { type: 'number' },
                          unit_price: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Sale recorded' }
          }
        }
      },
      '/api/suppliers': {
        get: {
          summary: 'List Suppliers and Dues',
          operationId: 'listSuppliers',
          responses: {
            '200': { description: 'List of suppliers and outstanding balances' }
          }
        }
      },
      '/api/expenses': {
        post: {
          summary: 'Record Shop Expense',
          operationId: 'recordExpense',
          description: 'Logs operating expense (rent, electricity, freight, chai/snacks, wages).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['description', 'amount', 'category'],
                  properties: {
                    description: { type: 'string' },
                    amount: { type: 'number' },
                    category: { type: 'string' },
                    payment_method: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Expense recorded' }
          }
        }
      }
    }
  };
}


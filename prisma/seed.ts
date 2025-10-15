import { PrismaClient } from '@prisma/client'
import { seedStaff } from './seed-staff'

const prisma = new PrismaClient()

async function seed() {
  console.log('🍟 Seeding digital menu database with fries, burgers & sodas...')

  // Clear existing data to avoid conflicts
  console.log('🧹 Cleaning existing data...')
  await prisma.itemModifierGroup.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.modifier.deleteMany()
  await prisma.modifierGroup.deleteMany()
  await prisma.item.deleteMany()
  await prisma.category.deleteMany()

  // Create Categories
  console.log('📂 Creating categories...')
  
  const burgersCategory = await prisma.category.create({
    data: {
      name: 'Burgers',
      description: 'Juicy, handcrafted burgers made with premium ingredients',
      displayOrder: 1,
      isActive: true,
    },
  })

  const friesCategory = await prisma.category.create({
    data: {
      name: 'Fries & Sides',
      description: 'Crispy golden fries and delicious sides',
      displayOrder: 2,
      isActive: true,
    },
  })

  const beveragesCategory = await prisma.category.create({
    data: {
      name: 'Beverages',
      description: 'Refreshing drinks to complement your meal',
      displayOrder: 3,
      isActive: true,
    },
  })

  // Create Modifier Groups
  console.log('🔧 Creating modifier groups...')
  
  const sizeGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Size',
      description: 'Choose your size',
      isRequired: true,
      minSelection: 1,
      maxSelection: 1,
      displayOrder: 1,
      isActive: true,
    },
  })

  const burgerExtrasGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Burger Extras',
      description: 'Add extra toppings to your burger',
      isRequired: false,
      minSelection: 0,
      maxSelection: null, // unlimited
      displayOrder: 2,
      isActive: true,
    },
  })

  const friesExtrasGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Fries Extras',
      description: 'Make your fries even better',
      isRequired: false,
      minSelection: 0,
      maxSelection: 3,
      displayOrder: 3,
      isActive: true,
    },
  })

  const drinkTypeGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Drink Type',
      description: 'Choose your beverage',
      isRequired: true,
      minSelection: 1,
      maxSelection: 1,
      displayOrder: 4,
      isActive: true,
    },
  })

  // Create Size Modifiers
  console.log('📏 Creating size modifiers...')
  
  const smallSize = await prisma.modifier.create({
    data: {
      modifierGroupId: sizeGroup.id,
      name: 'Small',
      priceAdjustment: 0,
      displayOrder: 1,
      isAvailable: true,
    },
  })

  const mediumSize = await prisma.modifier.create({
    data: {
      modifierGroupId: sizeGroup.id,
      name: 'Medium',
      priceAdjustment: 2.00,
      displayOrder: 2,
      isAvailable: true,
    },
  })

  const largeSize = await prisma.modifier.create({
    data: {
      modifierGroupId: sizeGroup.id,
      name: 'Large',
      priceAdjustment: 3.50,
      displayOrder: 3,
      isAvailable: true,
    },
  })

  // Create Burger Extras
  console.log('🍔 Creating burger extras...')
  
  const extraCheese = await prisma.modifier.create({
    data: {
      modifierGroupId: burgerExtrasGroup.id,
      name: 'Extra Cheese',
      priceAdjustment: 1.50,
      displayOrder: 1,
      isAvailable: true,
    },
  })

  const bacon = await prisma.modifier.create({
    data: {
      modifierGroupId: burgerExtrasGroup.id,
      name: 'Crispy Bacon',
      priceAdjustment: 2.50,
      displayOrder: 2,
      isAvailable: true,
    },
  })

  const avocado = await prisma.modifier.create({
    data: {
      modifierGroupId: burgerExtrasGroup.id,
      name: 'Fresh Avocado',
      priceAdjustment: 2.00,
      displayOrder: 3,
      isAvailable: true,
    },
  })

  const extraPatty = await prisma.modifier.create({
    data: {
      modifierGroupId: burgerExtrasGroup.id,
      name: 'Extra Patty',
      priceAdjustment: 4.00,
      displayOrder: 4,
      isAvailable: true,
    },
  })

  // Create Fries Extras
  console.log('🍟 Creating fries extras...')
  
  const cheeseTopping = await prisma.modifier.create({
    data: {
      modifierGroupId: friesExtrasGroup.id,
      name: 'Cheese Sauce',
      priceAdjustment: 1.00,
      displayOrder: 1,
      isAvailable: true,
    },
  })

  const baconBits = await prisma.modifier.create({
    data: {
      modifierGroupId: friesExtrasGroup.id,
      name: 'Bacon Bits',
      priceAdjustment: 1.50,
      displayOrder: 2,
      isAvailable: true,
    },
  })

  const truflleOil = await prisma.modifier.create({
    data: {
      modifierGroupId: friesExtrasGroup.id,
      name: 'Truffle Oil',
      priceAdjustment: 2.50,
      displayOrder: 3,
      isAvailable: true,
    },
  })

  // Create Drink Types
  console.log('🥤 Creating drink types...')
  
  const cola = await prisma.modifier.create({
    data: {
      modifierGroupId: drinkTypeGroup.id,
      name: 'Coca-Cola',
      priceAdjustment: 0,
      displayOrder: 1,
      isAvailable: true,
    },
  })

  const sprite = await prisma.modifier.create({
    data: {
      modifierGroupId: drinkTypeGroup.id,
      name: 'Sprite',
      priceAdjustment: 0,
      displayOrder: 2,
      isAvailable: true,
    },
  })

  const orangeFanta = await prisma.modifier.create({
    data: {
      modifierGroupId: drinkTypeGroup.id,
      name: 'Orange Fanta',
      priceAdjustment: 0,
      displayOrder: 3,
      isAvailable: true,
    },
  })

  // Create Burger Items
  console.log('🍔 Creating burger items...')
  
  const classicBurger = await prisma.item.create({
    data: {
      categoryId: burgersCategory.id,
      name: 'Classic Burger',
      description: 'Juicy beef patty, lettuce, tomato, onion, pickles, and our signature sauce',
      price: 12.99,
      imageUrl: '/images/classic-burger.jpg',
      displayOrder: 1,
      isAvailable: true,
      isActive: true,
      calories: 650,
      prepTime: 12,
      spicyLevel: 0,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      allergens: JSON.stringify(['gluten', 'dairy', 'eggs']),
      stockCount: 50,
      lowStockAlert: 10,
    },
  })

  const cheeseBurger = await prisma.item.create({
    data: {
      categoryId: burgersCategory.id,
      name: 'Cheeseburger',
      description: 'Classic burger with melted American cheese',
      price: 14.49,
      imageUrl: '/images/cheeseburger.jpg',
      displayOrder: 2,
      isAvailable: true,
      isActive: true,
      calories: 720,
      prepTime: 12,
      spicyLevel: 0,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      allergens: JSON.stringify(['gluten', 'dairy', 'eggs']),
      stockCount: 45,
      lowStockAlert: 10,
    },
  })

  const bbqBurger = await prisma.item.create({
    data: {
      categoryId: burgersCategory.id,
      name: 'BBQ Bacon Burger',
      description: 'Smoky BBQ sauce, crispy bacon, cheddar cheese, and onion rings',
      price: 16.99,
      imageUrl: '/images/bbq-burger.jpg',
      displayOrder: 3,
      isAvailable: true,
      isActive: true,
      calories: 890,
      prepTime: 15,
      spicyLevel: 1,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      allergens: JSON.stringify(['gluten', 'dairy', 'eggs']),
      stockCount: 30,
      lowStockAlert: 8,
    },
  })

  const veggieBurger = await prisma.item.create({
    data: {
      categoryId: burgersCategory.id,
      name: 'Veggie Burger',
      description: 'Plant-based patty with fresh vegetables and vegan mayo',
      price: 13.99,
      imageUrl: '/images/veggie-burger.jpg',
      displayOrder: 4,
      isAvailable: true,
      isActive: true,
      calories: 520,
      prepTime: 10,
      spicyLevel: 0,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false,
      allergens: JSON.stringify(['gluten', 'soy']),
      stockCount: 25,
      lowStockAlert: 5,
    },
  })

  // Create Fries Items
  console.log('🍟 Creating fries items...')
  
  const classicFries = await prisma.item.create({
    data: {
      categoryId: friesCategory.id,
      name: 'Classic Fries',
      description: 'Golden crispy fries seasoned with sea salt',
      price: 4.99,
      imageUrl: '/images/classic-fries.jpg',
      displayOrder: 1,
      isAvailable: true,
      isActive: true,
      calories: 365,
      prepTime: 8,
      spicyLevel: 0,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: JSON.stringify([]),
      stockCount: 100,
      lowStockAlert: 20,
    },
  })

  const sweetPotatoFries = await prisma.item.create({
    data: {
      categoryId: friesCategory.id,
      name: 'Sweet Potato Fries',
      description: 'Crispy sweet potato fries with a hint of cinnamon',
      price: 6.49,
      imageUrl: '/images/sweet-potato-fries.jpg',
      displayOrder: 2,
      isAvailable: true,
      isActive: true,
      calories: 320,
      prepTime: 10,
      spicyLevel: 0,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: JSON.stringify([]),
      stockCount: 40,
      lowStockAlert: 10,
    },
  })

  const curlyFries = await prisma.item.create({
    data: {
      categoryId: friesCategory.id,
      name: 'Curly Fries',
      description: 'Seasoned curly fries with paprika and garlic powder',
      price: 5.99,
      imageUrl: '/images/curly-fries.jpg',
      displayOrder: 3,
      isAvailable: true,
      isActive: true,
      calories: 420,
      prepTime: 9,
      spicyLevel: 1,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: JSON.stringify([]),
      stockCount: 60,
      lowStockAlert: 15,
    },
  })

  // Create Beverage Items
  console.log('🥤 Creating beverage items...')
  
  const soda = await prisma.item.create({
    data: {
      categoryId: beveragesCategory.id,
      name: 'Soft Drink',
      description: 'Choose from our selection of refreshing sodas',
      price: 2.99,
      imageUrl: '/images/sodas.jpg',
      displayOrder: 1,
      isAvailable: true,
      isActive: true,
      calories: 150,
      prepTime: 1,
      spicyLevel: 0,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: JSON.stringify([]),
      stockCount: 200,
      lowStockAlert: 50,
    },
  })

  const water = await prisma.item.create({
    data: {
      categoryId: beveragesCategory.id,
      name: 'Bottled Water',
      description: 'Pure spring water',
      price: 1.99,
      imageUrl: '/images/water.jpg',
      displayOrder: 2,
      isAvailable: true,
      isActive: true,
      calories: 0,
      prepTime: 1,
      spicyLevel: 0,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: JSON.stringify([]),
      stockCount: 150,
      lowStockAlert: 30,
    },
  })

  // Link Items to Modifier Groups
  console.log('🔗 Linking items to modifier groups...')
  
  await prisma.itemModifierGroup.createMany({
    data: [
      // Burger extras for all burgers
      { itemId: classicBurger.id, modifierGroupId: burgerExtrasGroup.id },
      { itemId: cheeseBurger.id, modifierGroupId: burgerExtrasGroup.id },
      { itemId: bbqBurger.id, modifierGroupId: burgerExtrasGroup.id },
      { itemId: veggieBurger.id, modifierGroupId: burgerExtrasGroup.id },
      
      // Size options for fries
      { itemId: classicFries.id, modifierGroupId: sizeGroup.id },
      { itemId: sweetPotatoFries.id, modifierGroupId: sizeGroup.id },
      { itemId: curlyFries.id, modifierGroupId: sizeGroup.id },
      
      // Fries extras for all fries
      { itemId: classicFries.id, modifierGroupId: friesExtrasGroup.id },
      { itemId: sweetPotatoFries.id, modifierGroupId: friesExtrasGroup.id },
      { itemId: curlyFries.id, modifierGroupId: friesExtrasGroup.id },
      
      // Size and drink type for sodas
      { itemId: soda.id, modifierGroupId: sizeGroup.id },
      { itemId: soda.id, modifierGroupId: drinkTypeGroup.id },
      
      // Size for water
      { itemId: water.id, modifierGroupId: sizeGroup.id },
    ],
  })

  // Create Sample Customers
  console.log('👥 Creating sample customers...')
  
  const customer1 = await prisma.customer.create({
    data: {
      whatsappNumber: '+1234567890',
      name: 'John Doe',
      email: 'john.doe@email.com',
      isActive: true,
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      whatsappNumber: '+1987654321',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      isActive: true,
    },
  })

  const customer3 = await prisma.customer.create({
    data: {
      whatsappNumber: '+1555123456',
      name: 'Mike Johnson',
      email: 'mike.j@email.com',
      isActive: true,
    },
  })

  // Set auto-increment for order numbers to start from 1000
  console.log('🔢 Setting order numbers to start from 1000...')
  try {
    // Try different sequence name formats
    await prisma.$executeRaw`ALTER SEQUENCE orders_orderNumber_seq RESTART WITH 1000;`
  } catch (error) {
    try {
      await prisma.$executeRaw`ALTER SEQUENCE orders_ordernumber_seq RESTART WITH 1000;`
    } catch (error2) {
      console.log('⚠️  Could not set sequence start value. Order numbers will start from 1.')
    }
  }

  // Seed staff members
  await seedStaff()

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('📊 Created:')
  console.log('- 3 categories (Burgers, Fries & Sides, Beverages)')
  console.log('- 4 modifier groups (Size, Burger Extras, Fries Extras, Drink Type)')
  console.log('- 12 modifiers (sizes, toppings, drink types)')
  console.log('- 7 menu items (4 burgers, 3 fries, 2 beverages)')
  console.log('- 3 sample customers')
  console.log('- 3 staff members (admin, manager, staff)')
  console.log('- Order numbers starting from 1000')
  console.log('')
  console.log('🍔 Ready to start testing your digital menu!')
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...");

  // 1. Xóa dữ liệu cũ nếu có
  await prisma.inventoryTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Tạo danh mục
  const catDrinks = await prisma.category.create({
    data: {
      name: "Đồ uống & Cà phê",
      slug: "do-uong-ca-phe",
      description: "Các loại nước ngọt, nước suối, trà và cà phê đóng chai",
    },
  });

  const catSnacks = await prisma.category.create({
    data: {
      name: "Bánh kẹo & Ăn vặt",
      slug: "banh-keo-an-vat",
      description: "Khoai tây chiên, snack, bánh quy, sô-cô-la",
    },
  });

  const catDairy = await prisma.category.create({
    data: {
      name: "Sữa & Chế phẩm sữa",
      slug: "sua-che-pham-sua",
      description: "Sữa tươi tiệt trùng, sữa chua, phô mai",
    },
  });

  const catDaily = await prisma.category.create({
    data: {
      name: "Hàng tiêu dùng nhanh",
      slug: "hang-tieu-dung",
      description: "Khăn giấy, dầu gội, xà phòng, bàn chải",
    },
  });

  console.log("✅ Đã tạo các danh mục thành công.");

  // 3. Tạo sản phẩm mẫu
  const productsData = [
    {
      sku: "DU-CF-01",
      barcode: "8935001100012",
      name: "Cà phê sữa đá Highlands (Lon 185ml)",
      description: "Cà phê sữa hòa tan đóng lon mát lạnh, đậm vị",
      costPrice: 11000,
      sellingPrice: 16000,
      stockQuantity: 120,
      minStockThreshold: 15,
      unit: "Lon",
      categoryId: catDrinks.id,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "DU-CC-02",
      barcode: "8935001100029",
      name: "Coca Cola Không Đường (Lon 320ml)",
      description: "Nước giải khát có ga không calo",
      costPrice: 7500,
      sellingPrice: 12000,
      stockQuantity: 85,
      minStockThreshold: 20,
      unit: "Lon",
      categoryId: catDrinks.id,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "DU-AQ-03",
      barcode: "8935001100036",
      name: "Nước khoáng thiên nhiên Aquafina 500ml",
      description: "Nước uống tinh khiết đạt chuẩn quốc tế",
      costPrice: 4000,
      sellingPrice: 7000,
      stockQuantity: 200,
      minStockThreshold: 30,
      unit: "Chai",
      categoryId: catDrinks.id,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "DU-TR-04",
      barcode: "8935001100043",
      name: "Trà xanh Không Độ 455ml",
      description: "Trà xanh thiên nhiên giàu chất chống oxy hóa EGCG",
      costPrice: 6500,
      sellingPrice: 11000,
      stockQuantity: 45,
      minStockThreshold: 10,
      unit: "Chai",
      categoryId: catDrinks.id,
      imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "BK-LY-01",
      barcode: "8935002100019",
      name: "Snack khoai tây Lay's Vị Tự Nhiên (54g)",
      description: "Khoai tây giòn rụm từ củ khoai tây tươi chọn lọc",
      costPrice: 12500,
      sellingPrice: 18000,
      stockQuantity: 60,
      minStockThreshold: 10,
      unit: "Gói",
      categoryId: catSnacks.id,
      imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "BK-OR-02",
      barcode: "8935002100026",
      name: "Bánh quy Oreo Vani gói 133g",
      description: "Bánh quy sô-cô-la kẹp kem vani trứ danh",
      costPrice: 14000,
      sellingPrice: 20000,
      stockQuantity: 40,
      minStockThreshold: 10,
      unit: "Gói",
      categoryId: catSnacks.id,
      imageUrl: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "SU-TH-01",
      barcode: "8935003100016",
      name: "Sữa tươi tiệt trùng TH True MILK Ít Đường (Hộp 1L)",
      description: "Sữa tươi sạch từ trang trại TH nguyên chất",
      costPrice: 32000,
      sellingPrice: 42000,
      stockQuantity: 28,
      minStockThreshold: 8,
      unit: "Hộp",
      categoryId: catDairy.id,
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "SU-YM-02",
      barcode: "8935003100023",
      name: "Sữa chua uống Probi Men sống (Lốc 5 chai x 65ml)",
      description: "Bổ sung hàng tỷ lợi khuẩn probiotics tốt cho tiêu hóa",
      costPrice: 22000,
      sellingPrice: 29000,
      stockQuantity: 18,
      minStockThreshold: 5,
      unit: "Lốc",
      categoryId: catDairy.id,
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "TD-KG-01",
      barcode: "8935004100013",
      name: "Khăn giấy lụa Pulppy (Gói 100 tờ)",
      description: "Mềm mại, dai mịn, 100% bột giấy tự nhiên",
      costPrice: 13000,
      sellingPrice: 19000,
      stockQuantity: 70,
      minStockThreshold: 15,
      unit: "Gói",
      categoryId: catDaily.id,
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60",
    },
    {
      sku: "TD-ST-02",
      barcode: "8935004100020",
      name: "Sữa tắm Lifebuoy Bảo Vệ Vượt Trội (Chai 200g)",
      description: "Diệt 99.9% vi khuẩn, bảo vệ cả gia đình",
      costPrice: 36000,
      sellingPrice: 49000,
      stockQuantity: 4, // Cảnh báo sắp hết hàng (< 5)
      minStockThreshold: 5,
      unit: "Chai",
      categoryId: catDaily.id,
      imageUrl: "https://images.unsplash.com/photo-1608248597359-002772714c62?w=400&auto=format&fit=crop&q=60",
    },
  ];

  for (const item of productsData) {
    const product = await prisma.product.create({
      data: item,
    });

    // Tạo bản ghi biến động kho khởi tạo ban đầu
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        type: "RESTOCK",
        quantityChange: product.stockQuantity,
        previousStock: 0,
        newStock: product.stockQuantity,
        note: "Khởi tạo tồn kho ban đầu khi nhập dữ liệu",
      },
    });
  }

  console.log(`✅ Đã tạo thành công ${productsData.length} sản phẩm mẫu và lịch sử kho.`);

  // 4. Tạo khách hàng mẫu
  const customers = [
    {
      name: "Nguyễn Văn Hùng",
      phone: "0912345678",
      email: "hung.nguyen@gmail.com",
      address: "45 Lê Lợi, P. Bến Nghé, Quận 1",
      totalSpent: 450000,
      points: 45,
    },
    {
      name: "Trần Thị Mai",
      phone: "0987654321",
      email: "mai.tran@yahoo.com",
      address: "12 Pasteur, Phường 6, Quận 3",
      totalSpent: 820000,
      points: 82,
    },
    {
      name: "Lê Hoàng Phúc",
      phone: "0933445566",
      email: "phuc.le@gmail.com",
      address: "78 Nguyễn Huệ, Quận 1",
      totalSpent: 120000,
      points: 12,
    },
  ];

  for (const cust of customers) {
    await prisma.customer.create({ data: cust });
  }

  console.log(`✅ Đã tạo ${customers.length} khách hàng mẫu.`);
  console.log("🎉 Hoàn tất quá trình nạp dữ liệu mẫu!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


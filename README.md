# Ramz E Takhleeq - Billing System

A complete online billing system for managing products, generating receipts, and tracking sales for Ramz E Takhleeq brand.

## Features

✅ **Two User Roles**
- **Admin**: Full access to all features including product management
- **Biller**: Can only create bills and edit sale prices during billing

✅ **Product Management** (Admin Only)
- Add/delete product categories
- Add/delete products with cost and sale prices
- Pre-loaded with all your products

✅ **Smart Billing**
- Easy product selection interface
- Real-time profit calculation
- Editable sale prices at billing time
- Adjustable quantities per product
- Clear cart functionality

✅ **Receipt System**
- Printable receipts
- Automatic receipt storage
- Receipt history with date filtering
- Detailed breakdown of each sale

✅ **Dashboard Analytics**
- Total revenue tracking
- Total profit calculation
- Cash in hand (profit + original cost)
- Individual product sales tracking
- Items sold per product
- Category-wise filtering

✅ **Beautiful UI**
- Dull green and yellow color scheme
- Clean, organized layout
- Separate tabs for each operation
- Mobile-responsive design

## Getting Started

### Option 1: Use Locally

1. Download all files (index.html, styles.css, app.js)
2. Open `index.html` in any web browser
3. That's it! The system works entirely in your browser

### Option 2: Host on GitHub Pages

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to repository Settings → Pages
4. Select "Deploy from branch" and choose "main" branch
5. Your site will be available at: `https://yourusername.github.io/repository-name`

## Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Biller Account:**
- Username: `biller`
- Password: `biller123`

## How to Use

### For Billing

1. Login with appropriate credentials
2. Go to "Billing" tab
3. Click on products to add them to cart
4. Adjust quantities and sale prices as needed
5. Click "Generate Receipt" to complete the sale
6. Print the receipt or close to continue

### For Managing Products (Admin Only)

1. Login as admin
2. Go to "Manage Products" tab
3. **Add Categories**: Enter category name and click "Add Category"
4. **Add Products**: Select category, enter product details (name, cost price, sale price), and click "Add Product"
5. Delete categories or products using the delete buttons

### Viewing Analytics

1. Go to "Dashboard" tab
2. View overall statistics at the top
3. See detailed product sales breakdown
4. Filter by category to analyze specific product lines

### Viewing Receipts

1. Go to "Receipts" tab
2. Click on any receipt to view details
3. Use date filter to find receipts from specific dates
4. Print receipts by clicking "Print" button

## Pre-loaded Products

The system comes with all your products already configured:

- **Diaries**: A5-001 to A5-012
- **Pocket Diaries**
- **Cards**: Small, Medium, Large, XL, XXL
- **Ramzan Calendar**: A4, Small
- **2026 Calendars**: DC-001 to DC-010
- **Bookmarks**: Printed, Hand made, Ramzan Juz Tracker
- **Counters**
- **Stickers**
- **Crochet Items**: 
  - Bandana (3 types)
  - Head Band
  - Gloves (3 types)
  - Wallet
  - Keychain (3 types)
- **Baking**

## Data Storage

- All data is stored in your browser's local storage
- Data persists between sessions
- No internet connection required after initial load
- Data is device-specific (not synced across devices)

## Tips

- **Always set cost and sale prices** for products before billing
- **Backup your data** by exporting receipts regularly
- **Use admin account** only for management tasks
- **Use biller account** for day-to-day billing operations
- The system **tracks quantities sold** but doesn't enforce stock limits

## Technical Details

- **Technology**: Pure HTML, CSS, and JavaScript
- **Storage**: Browser localStorage
- **No Backend Required**: Everything runs client-side
- **Offline Capable**: Works without internet after loading
- **Print Support**: Built-in receipt printing

## Support

For any issues or questions about the billing system, please refer to this documentation or contact the developer.

---

**Built for Ramz E Takhleeq** - February 2026

import { uploadImageDataUri } from './cloudinary';

interface InvoiceItem {
  name: string;
  price?: number;
  quantity: number;
}

interface InvoiceAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface InvoiceOrder {
  transactionId: string;
  createdAt?: Date | string;
  items: InvoiceItem[];
  total: number;
  shippingAddress?: InvoiceAddress;
  paymentStatus?: string;
  cashfreeOrderId?: string;
  shiprocketOrderId?: string;
  awbCode?: string;
  courierName?: string;
}

interface UploadedInvoice {
  invoiceUrl: string;
  invoicePublicId: string;
}

const escapeXml = (value: unknown): string => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const truncate = (value: unknown, length: number): string => {
  const text = String(value || '');
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
};

const formatCurrency = (amount: number): string => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (value?: Date | string): string => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString('en-IN');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const svgText = (x: number, y: number, content: unknown, className: string): string => {
  return `<text x="${x}" y="${y}" class="${className}">${escapeXml(content)}</text>`;
};

const buildInvoiceSvg = (order: InvoiceOrder): string => {
  const rowHeight = 72;
  const height = 1060 + Math.max(0, order.items.length - 1) * rowHeight;
  const address = order.shippingAddress;
  const itemRows = order.items.map((item, index) => {
    const y = 520 + index * rowHeight;
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);
    return `
      <rect x="80" y="${y - 38}" width="1040" height="58" rx="12" fill="${index % 2 === 0 ? '#f8fafc' : '#ffffff'}"/>
      ${svgText(110, y, truncate(item.name, 54), 'itemName')}
      ${svgText(720, y, quantity, 'cell')}
      ${svgText(840, y, formatCurrency(price), 'cell')}
      ${svgText(1000, y, formatCurrency(price * quantity), 'cellStrong')}
    `;
  }).join('');
  const summaryY = 560 + order.items.length * rowHeight;
  const footerY = height - 110;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}">
      <defs>
        <linearGradient id="brand" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
        <style>
          .tiny{font:700 22px Arial,sans-serif;letter-spacing:4px;fill:#64748b;text-transform:uppercase}
          .brand{font:900 54px Arial,sans-serif;letter-spacing:-2px;fill:#0f172a}
          .title{font:900 48px Arial,sans-serif;letter-spacing:-1px;fill:#0f172a}
          .label{font:800 20px Arial,sans-serif;letter-spacing:3px;fill:#64748b;text-transform:uppercase}
          .value{font:700 27px Arial,sans-serif;fill:#0f172a}
          .muted{font:600 22px Arial,sans-serif;fill:#475569}
          .tableHead{font:900 18px Arial,sans-serif;letter-spacing:3px;fill:#ffffff;text-transform:uppercase}
          .itemName{font:800 24px Arial,sans-serif;fill:#0f172a}
          .cell{font:700 22px Arial,sans-serif;fill:#334155;text-anchor:end}
          .cellStrong{font:900 22px Arial,sans-serif;fill:#0f172a;text-anchor:end}
          .total{font:900 42px Arial,sans-serif;fill:#0f172a;text-anchor:end}
          .footer{font:700 18px Arial,sans-serif;letter-spacing:2px;fill:#64748b;text-transform:uppercase}
        </style>
      </defs>
      <rect width="1200" height="${height}" fill="#eef2f7"/>
      <rect x="44" y="44" width="1112" height="${height - 88}" rx="36" fill="#ffffff"/>
      <rect x="44" y="44" width="1112" height="18" rx="9" fill="url(#brand)"/>

      ${svgText(80, 135, 'Hola Thrift', 'brand')}
      ${svgText(84, 174, 'Curated streetwear archive', 'tiny')}
      ${svgText(880, 132, 'Invoice', 'title')}
      ${svgText(884, 174, `#${order.transactionId}`, 'muted')}

      <rect x="80" y="225" width="500" height="170" rx="24" fill="#f8fafc"/>
      ${svgText(110, 270, 'Bill To', 'label')}
      ${svgText(110, 310, address?.name || 'Customer', 'value')}
      ${svgText(110, 345, address?.email || '', 'muted')}
      ${svgText(110, 378, address?.phone || '', 'muted')}

      <rect x="620" y="225" width="500" height="170" rx="24" fill="#f8fafc"/>
      ${svgText(650, 270, 'Ship To', 'label')}
      ${svgText(650, 310, truncate(address?.address || '', 42), 'value')}
      ${svgText(650, 345, [address?.city, address?.state, address?.pincode].filter(Boolean).join(', '), 'muted')}
      ${svgText(650, 378, `Date ${formatDate(order.createdAt)}`, 'muted')}

      <rect x="80" y="438" width="1040" height="56" rx="16" fill="#0f172a"/>
      ${svgText(110, 474, 'Item', 'tableHead')}
      ${svgText(740, 474, 'Qty', 'tableHead')}
      ${svgText(840, 474, 'Price', 'tableHead')}
      ${svgText(996, 474, 'Total', 'tableHead')}
      ${itemRows}

      <rect x="680" y="${summaryY}" width="440" height="170" rx="24" fill="#f8fafc"/>
      ${svgText(720, summaryY + 52, 'Payment', 'label')}
      ${svgText(720, summaryY + 92, order.paymentStatus || 'PAID', 'value')}
      ${svgText(720, summaryY + 128, order.cashfreeOrderId ? `Cashfree ${order.cashfreeOrderId}` : 'Cashfree checkout', 'muted')}
      ${svgText(1080, summaryY + 98, formatCurrency(order.total), 'total')}

      <rect x="80" y="${summaryY}" width="560" height="170" rx="24" fill="#f8fafc"/>
      ${svgText(110, summaryY + 52, 'Delivery', 'label')}
      ${svgText(110, summaryY + 92, order.courierName || 'Shiprocket', 'value')}
      ${svgText(110, summaryY + 128, order.awbCode ? `AWB ${order.awbCode}` : 'Shipment will be updated soon', 'muted')}

      <line x1="80" x2="1120" y1="${footerY - 45}" y2="${footerY - 45}" stroke="#e2e8f0" stroke-width="2"/>
      ${svgText(80, footerY, 'Thank you for shopping with Hola Thrift', 'footer')}
      ${svgText(80, footerY + 34, 'holathrift.in', 'footer')}
    </svg>
  `;
};

export const createAndUploadInvoice = async (order: InvoiceOrder): Promise<UploadedInvoice> => {
  const svg = buildInvoiceSvg(order);
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const upload = await uploadImageDataUri(dataUri, {
    folder: 'holathrift_invoices',
    public_id: `invoice_${order.transactionId}`,
    format: 'jpg',
    resource_type: 'image',
    overwrite: true,
  });

  return {
    invoiceUrl: upload.secure_url,
    invoicePublicId: upload.public_id,
  };
};

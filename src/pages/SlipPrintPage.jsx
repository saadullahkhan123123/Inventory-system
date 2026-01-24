import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font
  } from '@react-pdf/renderer';
  
  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12 },
    header: { textAlign: 'center', marginBottom: 20 },
    table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, marginBottom: 20 },
    tableRow: { flexDirection: "row" },
    tableColHeader: { width: "25%", borderStyle: "solid", borderWidth: 1, backgroundColor: "#eee", padding: 4 },
    tableCol: { width: "25%", borderStyle: "solid", borderWidth: 1, padding: 4 },
    totals: { marginTop: 10, textAlign: "right" }
  });
  
  const SlipPDFDocument = ({ slip }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Saeed Auto</Text>
          <Text>Contact: 0312258725</Text>
        </View>
  
        {/* Customer Info */}
        <View>
          <Text>Slip #: {slip.slipNumber}</Text>
          <Text>Date: {new Date(slip.date).toLocaleString()}</Text>
          <Text>Customer: {slip.customerName}</Text>
          <Text>Phone: {slip.customerPhone}</Text>
        </View>
  
        {/* Products Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Product</Text>
            <Text style={styles.tableColHeader}>Qty</Text>
            <Text style={styles.tableColHeader}>Unit Price</Text>
            <Text style={styles.tableColHeader}>Total Price</Text>
          </View>
          {slip.products.map((p, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.tableCol}>{p.productName}</Text>
              <Text style={styles.tableCol}>{p.quantity}</Text>
              <Text style={styles.tableCol}>Rs {p.unitPrice}</Text>
              <Text style={styles.tableCol}>Rs {p.totalPrice}</Text>
            </View>
          ))}
        </View>
  
        {/* Totals */}
        <View style={styles.totals}>
          <Text>Subtotal: Rs {slip.subtotal}</Text>
          <Text>Tax: Rs {slip.tax}</Text>
          <Text>Discount: Rs {slip.discount}</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total: Rs {slip.totalAmount}</Text>
        </View>
  
        {/* Footer */}
        <View style={{ marginTop: 30, textAlign: "center" }}>
          <Text>Thank you for your purchase!</Text>
          <Text>— Saeed Auto —</Text>
        </View>
      </Page>
    </Document>
  );
  
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
          <Text>Contact: 03122587825</Text>
        </View>
  
        {/* Customer Info */}
        <View>
          <Text>Slip #: {slip.slipNumber || slip._id}</Text>
          <Text>Date: {new Date(slip.date || slip.createdAt).toLocaleString()}</Text>
          <Text>Customer: {slip.customerName || 'Walk Customer'}</Text>
          {slip.customerPhone && <Text>Phone: {slip.customerPhone}</Text>}
          <Text>Payment Method: {slip.paymentMethod || 'Cash'}</Text>
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
          <Text>Subtotal: Rs {slip.subtotal?.toLocaleString() || 0}</Text>
          {slip.discount > 0 && (
            <Text>Discount: -Rs {slip.discount?.toLocaleString() || 0}</Text>
          )}
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total Amount: Rs {slip.totalAmount?.toLocaleString() || 0}</Text>
          
          {/* Udhar Payment Details */}
          {slip.paymentMethod === 'Udhar' && (
            <>
              {slip.previousBalance > 0 && (
                <Text>Previous Balance: Rs {slip.previousBalance?.toLocaleString() || 0}</Text>
              )}
              {slip.partialPayment > 0 && (
                <Text style={{ color: '#4caf50', fontSize: 13, fontWeight: 'bold' }}>
                  Pay Now: Rs {slip.partialPayment?.toLocaleString() || 0}
                </Text>
              )}
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ff9800' }}>
                Remaining Balance: Rs {(slip.remainingBalance || ((slip.currentBalance || slip.totalAmount || 0) - (slip.partialPayment || 0))).toLocaleString()}
              </Text>
            </>
          )}
        </View>
  
        {/* Footer */}
        <View style={{ marginTop: 30, textAlign: "center" }}>
          <Text>Thank you for your purchase!</Text>
          <Text>— Saeed Auto —</Text>
        </View>
      </Page>
    </Document>
  );
  
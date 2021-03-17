const { google, sheets_v4 } = require('googleapis');

require('dotenv').config();

class SpreadsheetClient {
  constructor() {
    this.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    this.sheets = google.sheets('v4');
  }

  async getAuthToken() {
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.split(
      '\\n'
    ).join('\n');
    const auth = new google.auth.GoogleAuth({
      scopes: this.scopes,
      credentials: {
        private_key: privateKey,
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      },
    });
    const authToken = await auth.getClient();
    return authToken;
  }

  async appendSpreadsheetValues({ auth, spreadsheetId, sheetName, values }) {
    const res = await this.sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return res;
  }
}

exports.SpreadsheetClient = SpreadsheetClient;

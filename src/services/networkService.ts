import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  static isConnected = true;

  static async checkConnection() {
    try {
      const state = await NetInfo.fetch();
      this.isConnected = state.isConnected || false;
      return this.isConnected;
    } catch (error) {
      console.error('Error checking network connection:', error);
      return false;
    }
  }

  static subscribeToConnectionChanges(callback: (isConnected: boolean) => void) {
    return NetInfo.addEventListener(state => {
      this.isConnected = state.isConnected || false;
      callback(this.isConnected);
    });
  }
}

export default NetworkService;

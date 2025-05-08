// Substitua pelos SEUS dados do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAB64YDXBqkcFT0MTzUT9edjcwhuWVZvCU",
    authDomain: "luanovarpg-90711.firebaseapp.com",
    databaseURL: "https://luanovarpg-90711-default-rtdb.firebaseio.com/",
    projectId: "luanovarpg-90711",
    storageBucket: "luanovarpg-90711.firebasestorage.app",
    messagingSenderId: "279486255638",
    appId: "1:279486255638:web:db0aa20c079bf4406cdb37"
  };
  
  // Inicialize o Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const auth = firebase.auth();
  
  // Função para salvar a ficha
  async function salvarFichaFirebase(userId, fichaData) {
    try {
      await database.ref('fichas/' + userId).set(fichaData);
      console.log("Ficha salva no Firebase!");
      return true;
    } catch (error) {
      console.error("Erro ao salvar:", error);
      return false;
    }
  }
  
  // Função para carregar a ficha
  async function carregarFichaFirebase(userId) {
    try {
      const snapshot = await database.ref('fichas/' + userId).once('value');
      return snapshot.val();
    } catch (error) {
      console.error("Erro ao carregar:", error);
      return null;
    }
  }
  
  // Exporte as funções se estiver usando módulos
  // export { salvarFichaFirebase, carregarFichaFirebase };
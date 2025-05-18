import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {
  const { userId, sessionClaims } = await auth()
  
  // Handle authenticated users with role-based redirection
  if (userId) {
    const userRole = sessionClaims?.metadata?.role as string | undefined
    
    // If user is logged in but has no role, redirect to registration
    if (!userRole) {
      redirect('/register')
    }
    
    // Redirect users based on their role
    if (userRole === 'ambulance') {
      redirect('/ambulance')
    } else if (userRole === 'hopital') {
      redirect('/hopital')
    } else if (userRole === 'admin') {
      redirect('/admin')
    }
  }
  
  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12 md:flex md:items-center md:justify-between">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            La solution d'urgence médicale nouvelle génération
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Ambu-Go connecte les ambulances avec les hôpitaux en temps réel pour une coordination optimale 
            des soins d'urgence et un transport rapide des patients.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg hover:bg-blue-700">
              Commencer
            </Link>
            <a href="#fonctionnalites" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md text-lg hover:bg-blue-50">
              En savoir plus
            </a>
          </div>
        </div>
        <div className="md:w-1/2">
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-blue-600 opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="8" rx="2" ry="2"/>
                <rect x="6" y="14" width="12" height="3"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
                <path d="M8 6v4M12 6v4M16 6v4"/>
                <path d="M8 10h8"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="fonctionnalites" className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Fonctionnalités clés</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-blue-600 text-4xl mb-4">🚑</div>
            <h3 className="text-xl font-bold mb-2">Gestion des ambulances</h3>
            <p className="text-gray-600">
              Suivi en temps réel des ambulances, gestion des interventions et transmission des données médicales critiques.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-blue-600 text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold mb-2">Coordination hospitalière</h3>
            <p className="text-gray-600">
              Interface dédiée pour les hôpitaux permettant de visualiser les arrivées imminentes et préparer les équipes médicales.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-blue-600 text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Réponse optimisée</h3>
            <p className="text-gray-600">
              Algorithmes d'optimisation pour réduire les temps de réponse et déterminer l'hôpital le plus adapté à chaque situation.
            </p>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-10">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">1</div>
                  <h3 className="text-xl font-bold">Prise en charge du patient</h3>
                </div>
                <p className="text-gray-600 ml-11">
                  L'ambulancier enregistre les informations critiques du patient et sa localisation.
                </p>
              </div>
              
              <div className="mb-10">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">2</div>
                  <h3 className="text-xl font-bold">Recherche d'hôpital</h3>
                </div>
                <p className="text-gray-600 ml-11">
                  Le système identifie automatiquement l'établissement le plus adapté en fonction des besoins médicaux.
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">3</div>
                  <h3 className="text-xl font-bold">Coordination en temps réel</h3>
                </div>
                <p className="text-gray-600 ml-11">
                  L'hôpital est alerté et prépare l'accueil pendant que l'ambulance suit l'itinéraire optimal vers la destination.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-6 rounded-lg">
              <div className="aspect-w-16 aspect-h-9 relative h-64 rounded overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à révolutionner les services d'urgence ?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Rejoignez Ambu-Go et participez à l'amélioration des soins d'urgence grâce à la technologie.
          </p>
          <Link href="/sign-up" className="inline-block px-8 py-4 bg-white text-blue-600 rounded-md font-bold text-lg hover:bg-blue-50">
            S'inscrire maintenant
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold mb-4">Ambu-Go</h3>
              <p className="text-gray-400">Connecter les ambulances et les hôpitaux pour des soins d'urgence optimisés.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">info@ambu-go.com</p>
              <p className="text-gray-400">Support d'urgence: (555) 123-4567</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            © {new Date().getFullYear()} Ambu-Go. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
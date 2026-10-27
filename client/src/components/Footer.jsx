import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">CharityChain</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              A local development demo. Donations use Hardhat test ETH only and
              are recorded by a Solidity smart contract.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Blockchain records transactions; it does not verify a charity or
              how funds are used.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/", label: "Home" },
                { to: "/campaigns", label: "Campaigns" },
                { to: "/verify", label: "Verify Transaction" },
                { to: "/donations", label: "Donation History" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © 2026 CharityChain — College Mini Project (Blockchain Technology)
          </p>
          <p className="text-xs text-gray-500">
            Blockchain makes donation records transparent, not charities
            verified.
          </p>
        </div>
      </div>
    </footer>
  );
}

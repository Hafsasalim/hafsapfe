import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Produits from './Produits';

// On mocke rigoureusement la méthode fetch globale
beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Mocha', price: 22, category: 'Chocolat', sales: 255, revenue: 5600 },
        { id: 2, name: 'Latte', price: 20, category: 'Lait', sales: 240, revenue: 4800 }
      ]),
    })
  );
});

afterEach(() => {
  global.fetch.mockRestore();
});

describe('Tests Unitaires Frontend - Page Produits', () => {

  test('Affiche des éléments skeletons pendant le chargement', () => {
    // On simule une promesse en attente infinie pour bloquer l'état chargement
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    
    const { container } = render(<Produits />);
    
    // On vérifie la présence de tes conteneurs de chargement dynamiques
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('Affiche les cartes de produits du catalogue après l\'appel API', async () => {
    render(<Produits />);

    // On attend que les données mockées remplacent le chargement initial
    await waitFor(() => {
      expect(screen.getByText('Mocha')).toBeInTheDocument();
      expect(screen.getByText('Latte')).toBeInTheDocument();
    });

    // Optionnel : On vérifie que les indicateurs de ventes spécifiques apparaissent aussi
    expect(screen.getByText(/255\s*ventes/i)).toBeInTheDocument();
  });
});
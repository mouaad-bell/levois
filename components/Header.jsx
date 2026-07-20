'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Header(){
  const [open,setOpen]=useState(false);
  return <header className="site-header">
    <div className="container nav-wrap">
      <Link href="/" className="wordmark" aria-label="Accueil LEVOIS">LEVOIS</Link>
      <button className="menu-button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Ouvrir le menu">Menu</button>
      <nav className={open?'nav open':'nav'} aria-label="Navigation principale">
        <Link href="/methode" onClick={()=>setOpen(false)}>La méthode</Link>
        <Link href="/ressources" onClick={()=>setOpen(false)}>Ressources</Link>
        <Link href="/mouaad" onClick={()=>setOpen(false)}>Mouaad</Link>
        <Link href="/diagnostic" className="nav-cta" onClick={()=>setOpen(false)}>Faire le point</Link>
      </nav>
    </div>
  </header>
}

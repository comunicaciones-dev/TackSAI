import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-4">
      <Image 
          src="https://www.atta.gov.cl/wp-content/uploads/2024/12/Logo-ATTA-2024.png" 
          alt="Logo UAT" 
          width={64} 
          height={64}
          className="h-16 w-16 object-contain"
      />
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Track SAI</h1>
        <p className="text-xs text-muted-foreground max-w-sm font-medium">
            Unidad Administradora de los Tribunales Tributarios y Aduaneros, y del Tribunal de Contratación Pública.
        </p>
      </div>
    </div>
  );
}

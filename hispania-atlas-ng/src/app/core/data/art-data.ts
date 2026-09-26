/**
 * src/app/core/data/art-data.ts
 *
 * Catálogo de obras de bellas artes y expresión (pintura, danza, música).
 * A diferencia de países y lugares, estos datos NO vienen del backend: son
 * contenido editorial estático, por eso viven aquí y no en un service.
 */
import type { ObraArte } from '../models';

export const artData: ObraArte[] = [
  {
    title: 'La Escuela Cusqueña',
    cat: 'Pintura Virreinal',
    country: 'Perú',
    img: 'https://i.pinimg.com/736x/d3/11/75/d31175d2d57ad37b9e8049d36ec4de0c.jpg',
    desc: 'Fusión de técnicas europeas con cosmovisión andina. Uso intensivo del brocateado en oro (estofado) y temática religiosa con presencia de flora y fauna local.',
  },
  {
    title: 'El Muralismo',
    cat: 'Pintura Moderna',
    country: 'México',
    img: 'https://cdn.culturagenial.com/es/imagenes/muralismo-mexicano-importancia-og.jpg',
    desc: 'Movimiento pictórico de fuerte carácter indigenista, social y monumental, buscando educar a las masas mediante grandes frescos.',
  },
  {
    title: 'La Marinera',
    cat: 'Danza Tradicional',
    country: 'Perú',
    img: 'https://th.bing.com/th/id/R.94ecc9c9e1995430cc9854d19ab08ba3?rik=2jUNjO8LccfZyQ&pid=ImgRaw&r=0',
    desc: 'Baile de pareja suelta que representa el galanteo, caracterizado por el uso del pañuelo, con raíces mestizas.',
  },
  {
    title: 'El Tango',
    cat: 'Danza y Música',
    country: 'Argentina',
    img: 'https://tse4.mm.bing.net/th/id/OIP.Bgb5PPGhp8uU9Y-FbY9q7QHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    desc: 'Nacido en los arrabales del Río de la Plata a fines del siglo XIX, con el bandoneón como instrumento distintivo.',
  },
];

import React from 'react';
import Slider from 'react-slick';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const newsItems = [
  {
    image: '/img/news1.png',
    title: 'Nuevo programa: "La Mañana X"',
    description: 'Se suma un nuevo programa a la grilla de Luzu.'
  },
  {
    image: '/img/news2.png',
    title: 'Cambio de horario en "Todo Pasa"',
    description: 'El programa ahora va de 13 a 15hs.'
  },
  {
    image: '/img/news3.png',
    title: 'Especial: Día del Amigo',
    description: 'Programación especial este viernes.'
  }
];

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 6000,
  arrows: false,
};

export default function NewsCarousel() {
  return (
    <Box
      sx={{
        width: 400,
        height: 105,
        position: 'absolute',
        top: -82,
        left: '67%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: 3,
        background: '#222',
      }}
    >
      <Slider {...sliderSettings}>
        {newsItems.map((item, idx) => (
          <Box key={idx} sx={{ position: 'relative', width: 400, height: 105 }}>
            <Image
              src={item.image}
              alt={item.title}
              width={400}
              height={105}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              priority={idx === 0}
            />
            <Box sx={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              bgcolor: 'rgba(0,0,0,0.45)',
              color: '#fff',
              p: 1,
            }}>
              <Typography variant="subtitle1" fontWeight={700}>{item.title}</Typography>
              <Typography variant="body2">{item.description}</Typography>
            </Box>
          </Box>
        ))}
      </Slider>
    </Box>
  );
} 
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { supabase, Banner } from '@/lib/supabase';
import { Button } from './ui/button';

export const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const loadBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('order_number', { ascending: true });

    if (!error && data) {
      setBanners(data);
    }
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const handleButtonClick = (link: string) => {
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      window.location.href = link;
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden group">
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full">
          {banners.map((banner) => (
            <div key={banner.id} className="relative flex-[0_0_100%] min-w-0 h-full">
              {/* Background Image */}
              {banner.background_image_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                  style={{ backgroundImage: `url(${banner.background_image_url})` }}
                />
              )}
              
              {/* Background Color Fallback */}
              {!banner.background_image_url && banner.background_color && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: banner.background_color }}
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 md:px-12">
                <h1
                  className="text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-3 md:mb-4 animate-fade-in max-w-4xl"
                  style={{ color: banner.text_color || '#FFFFFF' }}
                >
                  {banner.title}
                </h1>
                
                {banner.subtitle && (
                  <p
                    className="text-base md:text-lg lg:text-xl text-center mb-6 md:mb-8 max-w-2xl animate-fade-in opacity-90"
                    style={{ color: banner.text_color || '#E5E7EB' }}
                  >
                    {banner.subtitle}
                  </p>
                )}

                {banner.button_text && banner.button_link && (
                  <Button
                    onClick={() => handleButtonClick(banner.button_link!)}
                    className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-2 md:py-3 text-base md:text-lg font-semibold animate-scale-in shadow-elegant"
                  >
                    {banner.button_text}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? 'bg-primary w-8'
                  : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

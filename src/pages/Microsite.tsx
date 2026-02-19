import { useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  Phone,
  Mail,
  Instagram,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react'
import { MicrositeService } from '@/services/micrositeService'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export default function Microsite() {
  const { slug } = useParams<{ slug: string }>()

  const {
    data: microsite,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['microsite-public', slug],
    queryFn: () => MicrositeService.getBySlug(slug!),
    enabled: !!slug,
  })

  // Use about_text as bio if bio is missing (handling type divergence)
  const displayBio = microsite?.about_text || microsite?.bio

  const trackView = useCallback(async (micrositeId: string) => {
    await MicrositeService.incrementViews(micrositeId)
  }, [])

  useEffect(() => {
    if (microsite?.id) {
      trackView(microsite.id)
    }
  }, [microsite?.id, trackView])

  const schemaOrgData = useMemo(() => {
    if (!microsite) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: microsite.business_name,
      image: microsite.logo_url,
      description: displayBio || microsite.tagline,
      telephone: microsite.phone,
      email: microsite.email,
      url: window.location.href,
      address:
        microsite.address || microsite.city
          ? {
              '@type': 'PostalAddress',
              streetAddress: microsite.address,
              addressLocality: microsite.city,
              addressRegion: microsite.state,
              addressCountry: 'BR',
            }
          : undefined,
      priceRange: '$$',
    }
  }, [microsite, displayBio])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !microsite) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-neutral-400 text-lg">Página não encontrada</p>
        </div>
      </div>
    )
  }

  const visibleServices = (microsite.services || [])
    // @ts-expect-error - is_visible might be missing in Service type but present in join
    .filter((s) => s.is_visible !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

  const sortedGallery = (microsite.gallery || []).sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (a.display_order || 0) - (b.display_order || 0)
  })

  const visibleTestimonials = (microsite.testimonials || [])
    .filter((t) => t.is_visible)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Helmet>
        <title>{microsite.meta_title || microsite.business_name}</title>
        <meta
          name="description"
          content={microsite.meta_description || microsite.tagline || ''}
        />
        {/* @ts-expect-error - meta_keywords array vs string issue */}
        {microsite.meta_keywords && Array.isArray(microsite.meta_keywords) && (
          <meta name="keywords" content={microsite.meta_keywords.join(', ')} />
        )}
        <meta
          property="og:title"
          content={microsite.meta_title || microsite.business_name}
        />
        <meta
          property="og:description"
          content={microsite.meta_description || microsite.tagline || ''}
        />
        {microsite.og_image_url && (
          <meta property="og:image" content={microsite.og_image_url} />
        )}
        <meta property="og:type" content="website" />

        {schemaOrgData && (
          <script type="application/ld+json">
            {JSON.stringify(schemaOrgData)}
          </script>
        )}
      </Helmet>

      <div
        className="min-h-screen"
        style={{
          backgroundColor: microsite.background_color || '#000',
          color: microsite.text_color || '#fff',
        }}
      >
        <section
          className="relative min-h-screen flex items-center justify-center px-4"
          style={{
            backgroundImage: microsite.cover_image_url
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${microsite.cover_image_url})`
              : `linear-gradient(135deg, ${microsite.primary_color || '#333'} 0%, ${microsite.secondary_color || '#000'} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="text-center z-10 max-w-3xl">
            {microsite.logo_url && (
              <img
                src={microsite.logo_url}
                alt={microsite.business_name}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full mx-auto mb-6 border-4 border-white/30 shadow-2xl object-cover"
              />
            )}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 leading-tight"
              style={{ color: microsite.text_color || '#fff' }}
            >
              {microsite.business_name}
            </h1>
            {microsite.tagline && (
              <p className="text-xl md:text-2xl mb-10 opacity-90">
                {microsite.tagline}
              </p>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              {microsite.enable_booking && (
                <Button
                  size="lg"
                  className="text-base px-8 py-6 rounded-full shadow-xl hover:scale-105 transition-transform"
                  onClick={() => scrollTo('booking')}
                  style={{
                    backgroundColor: microsite.accent_color || '#fff',
                    color: microsite.background_color || '#000',
                  }}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Agendar
                </Button>
              )}
              {microsite.whatsapp_link && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 rounded-full border-2 hover:scale-105 transition-transform"
                  onClick={() =>
                    window.open(microsite.whatsapp_link!, '_blank')
                  }
                  style={{
                    borderColor: microsite.text_color || '#fff',
                    color: microsite.text_color || '#fff',
                  }}
                >
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </section>

        {microsite.enable_about && displayBio && (
          <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2
                className="text-4xl font-bold mb-8"
                style={{ color: microsite.primary_color || '#fff' }}
              >
                Sobre Mim
              </h2>
              <p className="text-lg leading-relaxed whitespace-pre-line opacity-90">
                {displayBio}
              </p>
            </div>
          </section>
        )}

        {microsite.enable_services && visibleServices.length > 0 && (
          <section
            className="py-20 px-4"
            style={{ backgroundColor: `${microsite.primary_color}08` }}
          >
            <div className="max-w-6xl mx-auto">
              <h2
                className="text-4xl font-bold mb-12 text-center"
                style={{ color: microsite.primary_color || '#fff' }}
              >
                Serviços
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    style={{
                      backgroundColor: microsite.background_color || '#000',
                      border: `1px solid ${microsite.text_color}15`,
                    }}
                  >
                    {/* @ts-expect-error - service.image_url might be missing in type */}
                    {service.image_url && (
                      // @ts-expect-error dynamic type mismatch
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="mb-4 opacity-70 text-sm">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {microsite.show_prices && service.price != null && (
                          <p
                            className="text-2xl font-bold"
                            style={{ color: microsite.accent_color || '#fff' }}
                          >
                            {currencyFormatter.format(service.price)}
                          </p>
                        )}
                        {service.duration_minutes && (
                          <span className="flex items-center gap-1 text-sm opacity-60">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes}min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {microsite.enable_gallery && sortedGallery.length > 0 && (
          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <h2
                className="text-4xl font-bold mb-12 text-center"
                style={{ color: microsite.primary_color || '#fff' }}
              >
                Portfólio
              </h2>
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {sortedGallery.map((item) => (
                  <div
                    key={item.id}
                    className="relative group overflow-hidden rounded-xl shadow-lg break-inside-avoid hover:shadow-2xl transition-shadow"
                  >
                    <img
                      src={item.image_url}
                      alt={item.caption || ''}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    {item.caption && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white text-sm">{item.caption}</p>
                      </div>
                    )}
                    {item.is_featured && (
                      <Badge
                        className="absolute top-3 right-3"
                        style={{
                          backgroundColor: microsite.accent_color || '#fff',
                          color: microsite.background_color || '#000',
                        }}
                      >
                        Destaque
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {microsite.enable_reviews && visibleTestimonials.length > 0 && (
          <section
            className="py-20 px-4"
            style={{ backgroundColor: `${microsite.secondary_color}08` }}
          >
            <div className="max-w-6xl mx-auto">
              <h2
                className="text-4xl font-bold mb-12 text-center"
                style={{ color: microsite.primary_color || '#fff' }}
              >
                Depoimentos
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {visibleTestimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="rounded-xl p-6 shadow-lg"
                    style={{
                      backgroundColor: microsite.background_color || '#000',
                      border: `1px solid ${microsite.text_color}10`,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {testimonial.client_photo_url ? (
                        <img
                          src={testimonial.client_photo_url}
                          alt={testimonial.client_name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                          style={{
                            backgroundColor: `${microsite.primary_color}30`,
                            color: microsite.primary_color || '#fff',
                          }}
                        >
                          {testimonial.client_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {testimonial.client_name}
                        </p>
                        {testimonial.event_type && (
                          <p className="text-sm opacity-60">
                            {testimonial.event_type}
                          </p>
                        )}
                      </div>
                    </div>
                    {testimonial.rating && (
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: testimonial.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-500 text-yellow-500"
                            />
                          ),
                        )}
                      </div>
                    )}
                    <p className="italic opacity-80 leading-relaxed">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(microsite.enable_contact || microsite.phone || microsite.email) && (
          <section id="contact" className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <h2
                className="text-4xl font-bold mb-12 text-center"
                style={{ color: microsite.primary_color || '#fff' }}
              >
                Contato
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  {microsite.phone && (
                    <a
                      href={`tel:${microsite.phone}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Phone
                        className="w-5 h-5"
                        style={{ color: microsite.accent_color || '#fff' }}
                      />
                      <span>{microsite.phone}</span>
                    </a>
                  )}
                  {microsite.email && (
                    <a
                      href={`mailto:${microsite.email}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Mail
                        className="w-5 h-5"
                        style={{ color: microsite.accent_color || '#fff' }}
                      />
                      <span>{microsite.email}</span>
                    </a>
                  )}
                  {microsite.instagram_handle && (
                    <a
                      href={`https://instagram.com/${microsite.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Instagram
                        className="w-5 h-5"
                        style={{ color: microsite.accent_color || '#fff' }}
                      />
                      <span>@{microsite.instagram_handle}</span>
                    </a>
                  )}
                  {microsite.address && (
                    <div className="flex items-start gap-3">
                      <MapPin
                        className="w-5 h-5 mt-0.5"
                        style={{ color: microsite.accent_color || '#fff' }}
                      />
                      <div>
                        <p>{microsite.address}</p>
                        {microsite.city && microsite.state && (
                          <p className="text-sm opacity-60">
                            {microsite.city}, {microsite.state}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {microsite.enable_booking && (
                  <div
                    id="booking"
                    className="rounded-xl p-6"
                    style={{ backgroundColor: `${microsite.primary_color}15` }}
                  >
                    <h3 className="text-2xl font-bold mb-3">
                      Agende seu Horário
                    </h3>
                    <p className="mb-6 opacity-70">
                      Entre em contato via WhatsApp:
                    </p>
                    <Button
                      className="w-full py-6 text-base rounded-xl hover:scale-[1.02] transition-transform"
                      onClick={() =>
                        window.open(
                          `${microsite.whatsapp_link || 'https://wa.me/'}?text=Olá! Gostaria de agendar um horário.`,
                          '_blank',
                        )
                      }
                      style={{
                        backgroundColor: microsite.accent_color || '#fff',
                        color: microsite.background_color || '#000',
                      }}
                    >
                      Conversar no WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <footer
          className="py-8 px-4 border-t"
          style={{ borderColor: `${microsite.text_color}15` }}
        >
          <div className="max-w-6xl mx-auto text-center">
            <p className="opacity-40 text-sm">
              © {new Date().getFullYear()} {microsite.business_name}
            </p>
            <p className="text-xs mt-1 opacity-20">Powered by Khaos Kontrol</p>
          </div>
        </footer>
      </div>
    </>
  )
}

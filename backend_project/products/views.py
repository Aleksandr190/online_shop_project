
# from rest_framework import generics
# from .models import Product
# from .serializers import ProductSerializer

# # Этот класс автоматически обрабатывает GET (список) и POST (создание)
# class ProductListCreateView(generics.ListCreateAPIView):
#     queryset = Product.objects.all()
#     serializer_class = ProductSerializer


from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SiteSettings

# Теперь этот эндпоинт отвечает ТОЛЬКО на GET-запросы (список товаров)
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SiteSettingsView(APIView):
    def get(self, request):
        # Берем первую (и единственную) запись. Если базы пустая — создаем дефолтную
        settings, created = SiteSettings.objects.get_or_create(id=1)
        
        logo_url = settings.logo.url if settings.logo else None
        # Если используете полный путь для React, можно сделать так:
        if logo_url and not logo_url.startswith('http'):
            logo_url = request.build_absolute_uri(logo_url)

        data = {
            "site_name": settings.site_name,
            "phone": settings.phone,
            "logo": logo_url
        }
        return Response(data)
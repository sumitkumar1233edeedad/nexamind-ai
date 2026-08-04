from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("chat/new/", views.new_chat, name="new_chat"),
    path("chat/<int:conversation_id>/", views.chat_room, name="chat_room"),
    path("chat/<int:conversation_id>/delete/", views.delete_chat, name="delete_chat"),
    path("login/", views.login_user, name="login"),
    path("register/", views.register_user, name="register"),
    path("logout/", views.logout_user, name="logout"),
    
]
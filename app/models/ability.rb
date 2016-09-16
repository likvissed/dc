class Ability
  include CanCan::Ability

  def initialize(user)
    # :manage - any actions
    #alias_action :index, :update, to: :custom
    alias_action :link_to_new_record, to: :link

    user ||= User.new

    # Доступ для метода link_to_new_record всем пользователям.
    # Внутри метода проводится проверка на доступ к запрашиваемой модели
    can :link, :all

    if user.has_role? :admin
      can :manage, :all
    elsif user.has_role? :manage_serv
      can :manage, :all
      cannot :manage, User
    else
      can :read, :all
    end
  end

end

class Ability
  include CanCan::Ability

  def initialize(user)
    # :manage - any actions
    # alias_action :index, :update, to: :custom
    alias_action :link_to_new_record, to: :link

    user ||= User.new

    # Доступ для метода link_to_new_record всем пользователям.
    # Внутри метода проводится проверка на доступ к экшену new соответствующей модели
    can :link, :all

    # Для администраторов
    if user.has_role? :admin
      can :manage, :all
    # Для пользователей, входящих в состав ***REMOVED***
    elsif user.has_role? :uivt
      can :read, [Service, Cluster, Server]
    # Для пользователей, не входящих в состав ***REMOVED***
    elsif user.has_role? :not_uivt
      can :read, [Service, Cluster]
    # Для руководителей
    elsif user.has_role? :head
      can :read, [Service, Cluster, NodeRole, Server, ServerType, ServerPart, DetailType]
    else
      cannot :manage, :all
    end

    # elsif user.has_role? :manage_serv
    #   can :manage, :all
    #   cannot :manage, User
  end

end

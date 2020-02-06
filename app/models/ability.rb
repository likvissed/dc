class Ability
  include CanCan::Ability

  # Чтобы не искать, в каких контроллерах дополнительно проверяется наличие той или иной роли, либо права доступа
  #
  # Страница "Сервисы":
  #   has_role:
  #     service_controller.rb: action "download_file"
  #     _preview.haml
  #     service_controller.js: ф-я initComplete()
  #
  # Страница "Серверы":
  #   has_role:
  #     cluster_controller.js: ф-я initComplete()
  #
  # Страница "Оборудование":
  #   has_role:
  #     server_controller.js: ф-я initComplete()
  #
  # Страница "Комплектующие":
  #   has_role:
  #     server_part_controller.js: ф-я initComplete()

  def initialize(user)
    # :manage - any actions

    alias_action :link_to_new_record, to: :get_link
    alias_action :role, to: :get_role

    user ||= User.new

    # Доступ для метода link_to_new_record всем пользователям.
    # Внутри метода проводится проверка на доступ к экшену new соответствующей модели
    can :get_link, :all
    can :get_role, :all

    # Для администраторов
    if user.has_role? :admin
      can :manage, :all
    # Для пользователей, входящих в состав ***REMOVED***
    elsif user.has_role? :uivt
      can :read, [Cluster, Server]

      # Доступ к сервисам на редактирование только для своего отдела
      can [:update, :generate_file, :download_file], Service, dept: UserIss.find_by(tn: user.tn).dept
      can [:read, :create], Service

    # Для пользователей, не входящих в состав ***REMOVED***
    elsif user.has_role? :not_uivt
      can :read, [Service, Cluster]
    # Для руководителей
    elsif user.has_role? :head
      can :read, [Service, Cluster, Server, ServerType, ServerPart]
    else
      cannot :manage, :all
    end
  end

  # Получить все права пользователя в виде объекта:
  # { <имя_права> => <массив_моделей> }
  def get_user_abilities
    rules = {}
    self.instance_variable_get("@rules").each do |rule|
      key         = rule.instance_variable_get("@actions").first
      rules[key]  = []
      rule.instance_variable_get("@subjects").each do |s|
        s.is_a?(Symbol) ? rules[key].push(s.to_s) : rules[key].push(s.name)
      end
    end

    rules
  end


end

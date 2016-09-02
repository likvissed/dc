class Ability
  include CanCan::Ability

  def initialize(user)
    # :manage - any actions
    #alias_action :index, :update, to: :custom
    user ||= User.new

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

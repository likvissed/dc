class Users::RegistrationsController < Devise::RegistrationsController

=begin
  before_action :check_permissions, only: [:new, :create, :cancel]
  skip_before_action :require_no_authentication

  def check_permissions
    authorize! :create, resource
  end
=end



end

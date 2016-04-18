class DetailType < ActiveRecord::Base
  has_many :server_parts, dependent: :restrict_with_error
end

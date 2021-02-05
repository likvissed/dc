class SystemRequirement < ActiveRecord::Base
  validates :name_os, presence: true
end

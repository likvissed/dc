class ServicesChangeColumnsKernelCount < ActiveRecord::Migration[5.2]
  def change
    change_column(:services, :kernel_count, :integer)
  end
end

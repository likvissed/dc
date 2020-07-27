class AddFormularTypeToServices < ActiveRecord::Migration[5.2]
  def change
    add_column :services, :formular_type, :boolean, after: :name, null: false
  end
end
